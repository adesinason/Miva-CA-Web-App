import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/dashboard/Sidebar'

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/signin')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, email, roles(name)')
    .eq('id', user.id)
    .single()

const rolesData = profile?.roles
const roleName = Array.isArray(rolesData)
  ? (rolesData[0] as { name: string } | undefined)?.name
  : (rolesData as unknown as { name: string } | null)?.name

  if (roleName !== 'student_staff') redirect('/dashboard')

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar
        role="student"
        userName={profile?.full_name ?? 'User'}
        userEmail={profile?.email ?? user.email ?? ''}
      />
      {/* Main content — offset by sidebar width on desktop */}
      <div className="lg:pl-64">
        {/* Top header */}
        <header className="sticky top-0 z-20 bg-white border-b border-gray-200 px-6 py-4 lg:mt-0 mt-14">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold text-gray-900">
                Welcome back, {profile?.full_name?.split(' ')[0] ?? 'there'} 👋
              </h1>
              <p className="text-sm text-gray-500">Student / Staff Portal</p>
            </div>
            <div className="flex items-center gap-3">
              {/* Notification bell */}
              <button className="relative p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
              </button>
              {/* Avatar */}
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold"
                style={{ background: 'linear-gradient(135deg, #1a4a7a, #0f2942)' }}>
                {profile?.full_name?.charAt(0).toUpperCase() ?? 'U'}
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  )
}