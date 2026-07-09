'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'

type Assignment = {
  id: string
  due_at: string | null
  assigned_at: string
  service_requests: {
    id: string
    title: string
    status: string
    priority: string
    location: string
    request_categories: { name: string } | null
    profiles: { full_name: string } | null
  } | null
}

const PRIORITY_STYLES: Record<string, string> = {
  low:    'bg-gray-100 text-gray-600',
  medium: 'bg-blue-50 text-blue-600',
  high:   'bg-orange-50 text-orange-600',
  urgent: 'bg-red-50 text-red-600',
}

export default function OfficerInProgressPage() {
  const router = useRouter()
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    async function fetchData() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('assignments')
        .select(`
          id, due_at, assigned_at,
          service_requests(id, title, status, priority, location,
            request_categories(name),
            profiles(full_name)
          )
        `)
        .eq('officer_id', user.id)
        .order('assigned_at', { ascending: false })

      if (data) {
        const inProgress = (data as unknown as Assignment[]).filter(
          a => ['assigned', 'in_progress'].includes(a.service_requests?.status ?? '')
        )
        setAssignments(inProgress)
      }
      setLoading(false)
    }
    fetchData()
  }, [])

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('en-NG', {
      day: 'numeric', month: 'short', year: 'numeric'
    })
  }

  function isOverdue(due_at: string | null) {
    if (!due_at) return false
    return new Date(due_at) < new Date()
  }

  function getDaysLeft(due_at: string | null) {
    if (!due_at) return null
    const diff = new Date(due_at).getTime() - new Date().getTime()
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24))
    return days
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">In Progress</h2>
        <p className="text-gray-500 mt-1 text-sm">
          {loading ? 'Loading...' : `${assignments.length} active task${assignments.length !== 1 ? 's' : ''}`}
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <svg className="animate-spin text-gray-400" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
          </svg>
        </div>
      ) : assignments.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: 'linear-gradient(135deg, #e8f0fe, #c7d7f9)' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1a4a7a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">No active tasks</h3>
          <p className="text-gray-500 text-sm">All caught up! Tasks you start will appear here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {assignments.map((a) => {
            const req = a.service_requests
            const overdue = isOverdue(a.due_at)
            const daysLeft = getDaysLeft(a.due_at)

            return (
              <div
                key={a.id}
                onClick={() => req && router.push(`/dashboard/officer/assignments/${req.id}`)}
                className={`bg-white rounded-2xl border shadow-sm p-5 cursor-pointer hover:shadow-md transition-all group ${
                  overdue ? 'border-red-200' : 'border-gray-100 hover:border-blue-200'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                        {req?.request_categories?.name ?? 'General'}
                      </span>
                      {req?.status === 'in_progress' && (
                        <span className="px-1.5 py-0.5 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700">
                          🔧 In Progress
                        </span>
                      )}
                      {req?.status === 'assigned' && (
                        <span className="px-1.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                          👤 Assigned
                        </span>
                      )}
                    </div>
                    <h3 className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">
                      {req?.title ?? 'Unknown'}
                    </h3>
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-400 flex-wrap">
                      <span>{req?.location}</span>
                      <span>·</span>
                      <span>Requester: {req?.profiles?.full_name ?? 'Unknown'}</span>
                      <span>·</span>
                      <span>Since: {formatDate(a.assigned_at)}</span>
                    </div>

                    {/* Due date indicator */}
                    {a.due_at && (
                      <div className={`mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${
                        overdue
                          ? 'bg-red-100 text-red-700'
                          : daysLeft !== null && daysLeft <= 2
                          ? 'bg-orange-100 text-orange-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                        </svg>
                        {overdue
                          ? `Overdue by ${Math.abs(daysLeft ?? 0)} day${Math.abs(daysLeft ?? 0) !== 1 ? 's' : ''}`
                          : daysLeft === 0
                          ? 'Due today'
                          : daysLeft === 1
                          ? 'Due tomorrow'
                          : `${daysLeft} days left`
                        }
                      </div>
                    )}
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize shrink-0 ${PRIORITY_STYLES[req?.priority ?? 'medium']}`}>
                    {req?.priority}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}