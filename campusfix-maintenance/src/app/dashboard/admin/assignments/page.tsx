'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'

type Assignment = {
  id: string
  notes: string | null
  due_at: string | null
  assigned_at: string
  service_requests: {
    id: string
    title: string
    status: string
    priority: string
    location: string
    profiles: { full_name: string } | null
    request_categories: { name: string } | null
  } | null
  profiles: { full_name: string; email: string } | null
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

export default function AdminAssignmentsPage() {
  const router = useRouter()
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    async function fetchAssignments() {
      const { data } = await supabase
        .from('assignments')
        .select(`
          id, notes, due_at, assigned_at,
          service_requests(id, title, status, priority, location,
            profiles(full_name),
            request_categories(name)
          ),
          profiles(full_name, email)
        `)
        .order('assigned_at', { ascending: false })

      if (data) setAssignments(data as unknown as Assignment[])
      setLoading(false)
    }
    fetchAssignments()
  }, [])

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('en-NG', {
      day: 'numeric', month: 'short', year: 'numeric'
    })
  }

  function isOverdue(due_at: string | null, status: string) {
    if (!due_at) return false
    if (status === 'completed' || status === 'closed') return false
    return new Date(due_at) < new Date()
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Assignments</h2>
        <p className="text-gray-500 mt-1 text-sm">
          {loading ? 'Loading...' : `${assignments.length} total assignments`}
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
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">No assignments yet</h3>
          <p className="text-gray-500 text-sm mb-5">Assign officers to requests from the All Requests page.</p>
          <button
            onClick={() => router.push('/dashboard/admin/requests')}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold"
            style={{ background: 'linear-gradient(135deg, #1a4a7a, #0f2942)' }}>
            View All Requests
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {assignments.map((a) => {
            const req = a.service_requests
            const overdue = isOverdue(a.due_at, req?.status ?? '')
            return (
              <div
                key={a.id}
                onClick={() => req && router.push(`/dashboard/admin/requests/${req.id}`)}
                className={`bg-white rounded-2xl border shadow-sm p-5 cursor-pointer hover:shadow-md transition-all group ${overdue ? 'border-red-200' : 'border-gray-100 hover:border-blue-200'}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    {overdue && (
                      <span className="inline-block mb-2 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-600">
                        ⚠️ Overdue
                      </span>
                    )}
                    <h3 className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors truncate">
                      {req?.title ?? 'Unknown Request'}
                    </h3>
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-400 flex-wrap">
                      <span className="flex items-center gap-1">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                        </svg>
                        Officer: <span className="font-medium text-gray-600">{a.profiles?.full_name ?? 'Unknown'}</span>
                      </span>
                      <span>·</span>
                      <span>Requester: {req?.profiles?.full_name ?? 'Unknown'}</span>
                      <span>·</span>
                      <span>{req?.request_categories?.name ?? 'General'}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-400 flex-wrap">
                      <span>Assigned: {formatDate(a.assigned_at)}</span>
                      {a.due_at && (
                        <>
                          <span>·</span>
                          <span className={overdue ? 'text-red-500 font-medium' : ''}>
                            Due: {formatDate(a.due_at)}
                          </span>
                        </>
                      )}
                    </div>
                    {a.notes && (
                      <p className="text-xs text-gray-500 mt-1.5 italic">{a.notes}</p>
                    )}
                  </div>
                  <div className="shrink-0">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_STYLES[req?.status ?? 'submitted']}`}>
                      {STATUS_LABELS[req?.status ?? 'submitted']}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}