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

const STATUS_STYLES: Record<string, string> = {
  submitted:   'bg-gray-100 text-gray-700',
  assigned:    'bg-blue-100 text-blue-700',
  in_progress: 'bg-yellow-100 text-yellow-700',
  completed:   'bg-green-100 text-green-700',
  closed:      'bg-green-100 text-green-800',
  rejected:    'bg-red-100 text-red-700',
}

const STATUS_LABELS: Record<string, string> = {
  submitted:   'Submitted',
  assigned:    'Assigned',
  in_progress: 'In Progress',
  completed:   'Completed',
  closed:      'Closed',
  rejected:    'Rejected',
}

const PRIORITY_STYLES: Record<string, string> = {
  low:    'bg-gray-100 text-gray-600',
  medium: 'bg-blue-50 text-blue-600',
  high:   'bg-orange-50 text-orange-600',
  urgent: 'bg-red-50 text-red-600',
}

export default function OfficerOverview() {
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

      if (data) setAssignments(data as unknown as Assignment[])
      setLoading(false)
    }
    fetchData()
  }, [])

  const stats = {
    total:       assignments.length,
    assigned:    assignments.filter(a => a.service_requests?.status === 'assigned').length,
    in_progress: assignments.filter(a => a.service_requests?.status === 'in_progress').length,
    completed:   assignments.filter(a => ['completed', 'closed'].includes(a.service_requests?.status ?? '')).length,
    overdue:     assignments.filter(a => {
      const s = a.service_requests?.status ?? ''
      return a.due_at && new Date(a.due_at) < new Date() && !['completed', 'closed'].includes(s)
    }).length,
  }

  const recent = assignments.slice(0, 5)

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('en-NG', {
      day: 'numeric', month: 'short', year: 'numeric'
    })
  }

  function isOverdue(due_at: string | null, status: string) {
    if (!due_at || ['completed', 'closed'].includes(status)) return false
    return new Date(due_at) < new Date()
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Overview</h2>
        <p className="text-gray-500 mt-1 text-sm">Your assigned maintenance tasks at a glance.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Assigned', value: stats.total, color: 'bg-blue-50 text-blue-700', icon: '📌', href: '/dashboard/officer/assignments' },
          { label: 'In Progress', value: stats.in_progress, color: 'bg-yellow-50 text-yellow-700', icon: '🔧', href: '/dashboard/officer/in-progress' },
          { label: 'Completed', value: stats.completed, color: 'bg-green-50 text-green-700', icon: '✅', href: '/dashboard/officer/completed' },
          { label: 'Overdue', value: stats.overdue, color: 'bg-red-50 text-red-700', icon: '⚠️', href: '/dashboard/officer/assignments' },
        ].map((stat) => (
          <div
            key={stat.label}
            onClick={() => router.push(stat.href)}
            className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm cursor-pointer hover:border-blue-200 hover:shadow-md transition-all"
          >
            <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl text-lg mb-3 ${stat.color}`}>
              {stat.icon}
            </div>
            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            <p className="text-sm text-gray-500 mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Recent assignments */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">Recent Assignments</h3>
          <button
            onClick={() => router.push('/dashboard/officer/assignments')}
            className="text-sm font-medium transition-colors"
            style={{ color: '#1a4a7a' }}
          >
            View all
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <svg className="animate-spin text-gray-400" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
          </div>
        ) : recent.length === 0 ? (
          <div className="text-center py-12 px-6">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ background: 'linear-gradient(135deg, #e8f0fe, #c7d7f9)' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1a4a7a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
              </svg>
            </div>
            <h4 className="font-semibold text-gray-900 mb-1">No assignments yet</h4>
            <p className="text-gray-500 text-sm">New tasks assigned by the admin will appear here.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {recent.map((a) => {
              const req = a.service_requests
              const overdue = isOverdue(a.due_at, req?.status ?? '')
              return (
                <div
                  key={a.id}
                  onClick={() => req && router.push(`/dashboard/officer/assignments/${req.id}`)}
                  className="flex items-center justify-between px-6 py-4 cursor-pointer hover:bg-gray-50 transition-colors group"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-900 group-hover:text-blue-700 transition-colors truncate">
                        {req?.title ?? 'Unknown'}
                      </p>
                      {overdue && (
                        <span className="px-1.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-600 shrink-0">
                          Overdue
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {req?.request_categories?.name ?? 'General'} · {req?.location} · {formatDate(a.assigned_at)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 ml-4 shrink-0">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${PRIORITY_STYLES[req?.priority ?? 'medium']}`}>
                      {req?.priority}
                    </span>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_STYLES[req?.status ?? 'assigned']}`}>
                      {STATUS_LABELS[req?.status ?? 'assigned']}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Urgent tasks */}
      {assignments.filter(a => a.service_requests?.priority === 'urgent' && !['completed', 'closed'].includes(a.service_requests?.status ?? '')).length > 0 && (
        <div className="rounded-2xl p-5 border border-red-200 bg-red-50">
          <h3 className="font-semibold text-red-800 mb-3 flex items-center gap-2">
            <span>⚠️</span> Urgent Tasks Requiring Immediate Attention
          </h3>
          <div className="space-y-2">
            {assignments
              .filter(a => a.service_requests?.priority === 'urgent' && !['completed', 'closed'].includes(a.service_requests?.status ?? ''))
              .map((a) => (
                <div
                  key={a.id}
                  onClick={() => router.push(`/dashboard/officer/assignments/${a.service_requests?.id}`)}
                  className="flex items-center justify-between bg-white rounded-xl px-4 py-3 cursor-pointer hover:shadow-sm transition-all"
                >
                  <p className="text-sm font-medium text-gray-900">{a.service_requests?.title}</p>
                  <span className="text-xs text-red-600 font-medium">{a.service_requests?.location}</span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  )
}