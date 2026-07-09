'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'

type Request = {
  id: string
  title: string
  status: string
  priority: string
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

export default function StudentOverview() {
  const router = useRouter()
  const [requests, setRequests] = useState<Request[]>([])
  const [loading, setLoading] = useState(true)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    async function fetchRequests() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('service_requests')
        .select('id, title, status, priority, created_at, request_categories(name)')
        .eq('requester_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5)

      if (data) setRequests(data as unknown as Request[])
      setLoading(false)
    }
    fetchRequests()
  }, [])

  const stats = {
    total:       requests.length,
    in_progress: requests.filter(r => r.status === 'in_progress' || r.status === 'assigned').length,
    completed:   requests.filter(r => r.status === 'completed' || r.status === 'closed').length,
    rejected:    requests.filter(r => r.status === 'rejected').length,
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('en-NG', {
      day: 'numeric', month: 'short', year: 'numeric'
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Overview</h2>
        <p className="text-gray-500 mt-1 text-sm">Track your maintenance requests and their status.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Requests', value: stats.total, color: 'bg-blue-50 text-blue-700', icon: '📋' },
          { label: 'In Progress', value: stats.in_progress, color: 'bg-yellow-50 text-yellow-700', icon: '⏳' },
          { label: 'Completed', value: stats.completed, color: 'bg-green-50 text-green-700', icon: '✅' },
          { label: 'Rejected', value: stats.rejected, color: 'bg-red-50 text-red-700', icon: '❌' },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl text-lg mb-3 ${stat.color}`}>
              {stat.icon}
            </div>
            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            <p className="text-sm text-gray-500 mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Recent requests */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">Recent Requests</h3>
          <button
            onClick={() => router.push('/dashboard/student/requests')}
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
        ) : requests.length === 0 ? (
          <div className="text-center py-12 px-6">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ background: 'linear-gradient(135deg, #e8f0fe, #c7d7f9)' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1a4a7a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
            </div>
            <h4 className="font-semibold text-gray-900 mb-1">No requests yet</h4>
            <p className="text-gray-500 text-sm mb-5">Submit your first maintenance request to get started.</p>
            <button
              onClick={() => router.push('/dashboard/student/new-request')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold"
              style={{ background: 'linear-gradient(135deg, #1a4a7a, #0f2942)' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              New Request
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {requests.map((req) => (
              <div
                key={req.id}
                onClick={() => router.push(`/dashboard/student/requests/${req.id}`)}
                className="flex items-center justify-between px-6 py-4 cursor-pointer hover:bg-gray-50 transition-colors group"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 group-hover:text-blue-700 transition-colors truncate">
                    {req.title}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {req.request_categories?.name ?? 'General'} · {formatDate(req.created_at)}
                  </p>
                </div>
                <span className={`ml-4 px-2.5 py-1 rounded-full text-xs font-semibold shrink-0 ${STATUS_STYLES[req.status]}`}>
                  {STATUS_LABELS[req.status]}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick action */}
      <div className="rounded-2xl p-6 text-white" style={{ background: 'linear-gradient(135deg, #1a4a7a, #0f2942)' }}>
        <h3 className="font-semibold mb-1">Got a new issue?</h3>
        <p className="text-blue-200 text-sm mb-4">Report it and our team will attend to it as quickly as possible.</p>
        <button
          onClick={() => router.push('/dashboard/student/new-request')}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-sm font-semibold transition-all hover:bg-blue-50"
          style={{ color: '#1a4a7a' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Submit New Request
        </button>
      </div>
    </div>
  )
}