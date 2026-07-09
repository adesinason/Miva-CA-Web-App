import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Routes that do NOT require authentication
const PUBLIC_ROUTES = [
  '/auth/signin',
  '/auth/signup',
  '/auth/forgot-password',
  '/auth/reset-password',
]

// Role-based default dashboard routes
const ROLE_DASHBOARDS: Record<string, string> = {
  administrator:        '/dashboard/admin',
  maintenance_officer:  '/dashboard/officer',
  student_staff:        '/dashboard/student',
}

// Helper to extract role name safely from Supabase join result
function extractRoleName(roles: unknown): string {
  if (!roles) return 'student_staff'
  if (Array.isArray(roles) && roles.length > 0) return roles[0]?.name ?? 'student_staff'
  if (typeof roles === 'object' && roles !== null && 'name' in roles) {
    return (roles as { name: string }).name ?? 'student_staff'
  }
  return 'student_staff'
}

async function getUserRole(supabase: ReturnType<typeof createServerClient>, userId: string): Promise<string> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('roles(name)')
    .eq('id', userId)
    .single()

  return extractRoleName(profile?.roles)
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow Next.js internals and static files through without checks
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.')
  ) {
    return NextResponse.next({ request })
  }

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session — required for Server Components to pick up auth state
  const { data: { user } } = await supabase.auth.getUser()

  const isPublicRoute = PUBLIC_ROUTES.some((route) =>
    pathname.startsWith(route)
  )

  // ── 1. Not logged in + trying to access a protected route ──
  if (!user && !isPublicRoute) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/auth/signin'
    redirectUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // ── 2. Logged in + trying to access an auth page ──
  if (user && isPublicRoute) {
    const roleName = await getUserRole(supabase, user.id)
    const dashboard = ROLE_DASHBOARDS[roleName] ?? '/dashboard/student'
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = dashboard
    return NextResponse.redirect(redirectUrl)
  }

  // ── 3. Logged in + accessing /dashboard root → redirect to role dashboard ──
  if (user && pathname === '/dashboard') {
    const roleName = await getUserRole(supabase, user.id)
    const dashboard = ROLE_DASHBOARDS[roleName] ?? '/dashboard/student'
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = dashboard
    return NextResponse.redirect(redirectUrl)
  }

  // ── 4. Role guard — prevent users from accessing wrong dashboards ──
  if (user && pathname.startsWith('/dashboard')) {
    const roleName = await getUserRole(supabase, user.id)
    const allowedDashboard = ROLE_DASHBOARDS[roleName] ?? '/dashboard/student'

    const isAccessingWrongDashboard =
      (pathname.startsWith('/dashboard/admin')   && roleName !== 'administrator') ||
      (pathname.startsWith('/dashboard/officer') && roleName !== 'maintenance_officer') ||
      (pathname.startsWith('/dashboard/student') && roleName !== 'student_staff')

    if (isAccessingWrongDashboard) {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = allowedDashboard
      return NextResponse.redirect(redirectUrl)
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}