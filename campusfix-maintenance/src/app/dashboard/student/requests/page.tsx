'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'

type Request = {
  id: string
  title: string
  description: string
  location: string
  priority: string
  status: string
  created_at: string
  request_categories: { name: string } | null
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

export default function MyRequestsPage() {
  const router = useRouter()
  const [requests, setRequests] = useState<Request[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    async function fetchRequests() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('service_requests')
        .select('id, title, description, location, priority, status, created_at, request_categories(name)')
        .eq('requester_id', user.id)
        .order('created_at', { ascending: false })

      if (!error && data) setRequests(data as unknown as Request[])
      setLoading(false)
    }

    fetchRequests()
  }, [])

  const filtered = filter === 'all'
    ? requests
    : requests.filter((r) => r.status === filter)

  const counts = {
    all: requests.length,
    submitted: requests.filter(r => r.status === 'submitted').length,
    in_progress: requests.filter(r => r.status === 'in_progress').length,
    completed: requests.filter(r => r.status === 'completed').length,
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('en-NG', {
      day: 'numeric', month: 'short', year: 'numeric'
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">My Requests</h2>
          <p className="text-gray-500 mt-1 text-sm">Track all your maintenance requests.</p>
        </div>
        <button
          onClick={() => router.push('/dashboard/student/new-request')}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold transition-all"
          style={{ background: 'linear-gradient(135deg, #1a4a7a, #0f2942)' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          New Request
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {[
          { key: 'all', label: 'All' },
          { key: 'submitted', label: 'Submitted' },
          { key: 'in_progress', label: 'In Progress' },
          { key: 'completed', label: 'Completed' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all border ${
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
              {counts[tab.key as keyof typeof counts] ?? 0}
            </span>
          </button>
        ))}
      </div>

      {/* Requests list */}
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
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">No requests found</h3>
          <p className="text-gray-500 text-sm mb-6">
            {filter === 'all' ? "You haven't submitted any requests yet." : `No ${STATUS_LABELS[filter]?.toLowerCase()} requests.`}
          </p>
          {filter === 'all' && (
            <button
              onClick={() => router.push('/dashboard/student/new-request')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold"
              style={{ background: 'linear-gradient(135deg, #1a4a7a, #0f2942)' }}
            >
              Submit First Request
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((req) => (
            <div
              key={req.id}
              onClick={() => router.push(`/dashboard/student/requests/${req.id}`)}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 cursor-pointer hover:border-blue-200 hover:shadow-md transition-all group"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                      {req.request_categories?.name ?? 'General'}
                    </span>
                  </div>
                  <h3 className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors truncate">
                    {req.title}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1 line-clamp-2">{req.description}</p>
                  <div className="flex items-center gap-2 mt-3 text-xs text-gray-400">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
                    </svg>
                    {req.location}
                    <span>·</span>
                    {formatDate(req.created_at)}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_STYLES[req.status]}`}>
                    {STATUS_LABELS[req.status]}
                  </span>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${PRIORITY_STYLES[req.priority]}`}>
                    {req.priority}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}