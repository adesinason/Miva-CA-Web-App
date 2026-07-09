'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'

type Request = {
  id: string
  title: string
  status: string
  priority: string
  location: string
  created_at: string
  request_categories: { name: string } | null
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

const PRIORITY_STYLES: Record<string, string> = {
  low:    'bg-gray-100 text-gray-600',
  medium: 'bg-blue-50 text-blue-600',
  high:   'bg-orange-50 text-orange-600',
  urgent: 'bg-red-50 text-red-600',
}

const STATUSES = ['all', 'submitted', 'assigned', 'in_progress', 'completed', 'closed', 'rejected']

export default function AdminRequestsPage() {
  const router = useRouter()
  const [requests, setRequests] = useState<Request[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    async function fetchRequests() {
      const { data } = await supabase
        .from('service_requests')
        .select('id, title, status, priority, location, created_at, request_categories(name), profiles(full_name, email)')
        .order('created_at', { ascending: false })

      if (data) setRequests(data as unknown as Request[])
      setLoading(false)
    }
    fetchRequests()
  }, [])

  const filtered = requests.filter((r) => {
    const matchSearch = search === '' ||
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      r.profiles?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      r.location.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'all' || r.status === statusFilter
    const matchPriority = priorityFilter === 'all' || r.priority === priorityFilter
    return matchSearch && matchStatus && matchPriority
  })

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('en-NG', {
      day: 'numeric', month: 'short', year: 'numeric'
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">All Requests</h2>
          <p className="text-gray-500 mt-1 text-sm">
            {loading ? 'Loading...' : `${filtered.length} of ${requests.length} requests`}
          </p>
        </div>
      </div>

      {/* Search and filters */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
        {/* Search */}
        <div className="relative">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Search by title, requester, or location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white transition-all"
            onFocus={(e) => e.target.style.boxShadow = '0 0 0 3px rgba(26,74,122,0.15)'}
            onBlur={(e) => e.target.style.boxShadow = 'none'}
          />
        </div>

        {/* Filter row */}
        <div className="flex gap-3 flex-wrap">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-700 focus:outline-none transition-all"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s === 'all' ? 'All Statuses' : STATUS_LABELS[s]}
              </option>
            ))}
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-700 focus:outline-none transition-all"
          >
            {['all', 'low', 'medium', 'high', 'urgent'].map((p) => (
              <option key={p} value={p}>
                {p === 'all' ? 'All Priorities' : p.charAt(0).toUpperCase() + p.slice(1)}
              </option>
            ))}
          </select>

          {(search || statusFilter !== 'all' || priorityFilter !== 'all') && (
            <button
              onClick={() => { setSearch(''); setStatusFilter('all'); setPriorityFilter('all') }}
              className="px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-500 hover:bg-gray-50 transition-all"
            >
              Clear filters
            </button>
          )}
        </div>
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
          <p className="text-gray-400 text-sm">No requests match your filters.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((req) => (
            <div
              key={req.id}
              onClick={() => router.push(`/dashboard/admin/requests/${req.id}`)}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 cursor-pointer hover:border-blue-200 hover:shadow-md transition-all group"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                      {req.request_categories?.name ?? 'General'}
                    </span>
                  </div>
                  <h3 className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">
                    {req.title}
                  </h3>
                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-400 flex-wrap">
                    <span className="flex items-center gap-1">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                      </svg>
                      {req.profiles?.full_name ?? 'Unknown'}
                    </span>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
                      </svg>
                      {req.location}
                    </span>
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