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
    description: string
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

export default function OfficerAssignmentsPage() {
  const router = useRouter()
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('active')

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    async function fetchAssignments() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('assignments')
        .select(`
          id, notes, due_at, assigned_at,
          service_requests(id, title, status, priority, location, description,
            request_categories(name),
            profiles(full_name)
          )
        `)
        .eq('officer_id', user.id)
        .order('assigned_at', { ascending: false })

      if (data) setAssignments(data as unknown as Assignment[])
      setLoading(false)
    }
    fetchAssignments()
  }, [])

  const filtered = assignments.filter((a) => {
    const status = a.service_requests?.status ?? ''
    if (filter === 'active') return !['completed', 'closed', 'rejected'].includes(status)
    if (filter === 'completed') return ['completed', 'closed'].includes(status)
    return true
  })

  const counts = {
    all: assignments.length,
    active: assignments.filter(a => !['completed', 'closed', 'rejected'].includes(a.service_requests?.status ?? '')).length,
    completed: assignments.filter(a => ['completed', 'closed'].includes(a.service_requests?.status ?? '')).length,
  }

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
        <h2 className="text-2xl font-bold text-gray-900">My Assignments</h2>
        <p className="text-gray-500 mt-1 text-sm">All maintenance tasks assigned to you.</p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {[
          { key: 'active', label: 'Active' },
          { key: 'completed', label: 'Completed' },
          { key: 'all', label: 'All' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all border ${
              filter === tab.key
                ? 'text-white border-transparent'
                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
            }`}
            style={filter === tab.key ? { background: 'linear-gradient(135deg, #1a4a7a, #0f2942)' } : {}}
          >
            {tab.label}
            <span className={`px-1.5 py-0.5 rounded-full text-xs font-bold ${
              filter === tab.key ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
            }`}>
              {counts[tab.key as keyof typeof counts]}
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <svg className="animate-spin text-gray-400" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
          </svg>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: 'linear-gradient(135deg, #e8f0fe, #c7d7f9)' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1a4a7a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">No assignments found</h3>
          <p className="text-gray-500 text-sm">
            {filter === 'active' ? 'No active tasks right now.' : 'No completed tasks yet.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((a) => {
            const req = a.service_requests
            const overdue = isOverdue(a.due_at, req?.status ?? '')
            return (
              <div
                key={a.id}
                onClick={() => req && router.push(`/dashboard/officer/assignments/${req.id}`)}
                className={`bg-white rounded-2xl border shadow-sm p-5 cursor-pointer hover:shadow-md transition-all group ${
                  overdue ? 'border-red-200 hover:border-red-300' : 'border-gray-100 hover:border-blue-200'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                        {req?.request_categories?.name ?? 'General'}
                      </span>
                      {overdue && (
                        <span className="px-1.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-600">
                          ⚠️ Overdue
                        </span>
                      )}
                    </div>
                    <h3 className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">
                      {req?.title ?? 'Unknown'}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1 line-clamp-1">{req?.description}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-400 flex-wrap">
                      <span className="flex items-center gap-1">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
                        </svg>
                        {req?.location}
                      </span>
                      <span>·</span>
                      <span>Requested by: {req?.profiles?.full_name ?? 'Unknown'}</span>
                      <span>·</span>
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
                      <p className="text-xs text-gray-500 mt-1.5 italic bg-gray-50 px-3 py-1.5 rounded-lg">
                        Note: {a.notes}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_STYLES[req?.status ?? 'assigned']}`}>
                      {STATUS_LABELS[req?.status ?? 'assigned']}
                    </span>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${PRIORITY_STYLES[req?.priority ?? 'medium']}`}>
                      {req?.priority}
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