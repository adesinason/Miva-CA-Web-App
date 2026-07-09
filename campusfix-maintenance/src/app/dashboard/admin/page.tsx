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
  location: string
  request_categories: { name: string } | null
  profiles: { full_name: string } | null
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

export default function AdminOverview() {
  const router = useRouter()
  const [requests, setRequests] = useState<Request[]>([])
  const [loading, setLoading] = useState(true)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    async function fetchData() {
      const { data } = await supabase
        .from('service_requests')
        .select('id, title, status, priority, created_at, location, request_categories(name), profiles(full_name)')
        .order('created_at', { ascending: false })
        .limit(8)

      if (data) setRequests(data as unknown as Request[])
      setLoading(false)
    }
    fetchData()
  }, [])

  const stats = {
    total:      requests.length,
    unassigned: requests.filter(r => r.status === 'submitted').length,
    in_progress: requests.filter(r => r.status === 'in_progress' || r.status === 'assigned').length,
    completed:  requests.filter(r => r.status === 'completed' || r.status === 'closed').length,
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
        <p className="text-gray-500 mt-1 text-sm">Manage all campus maintenance requests and officers.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Requests', value: stats.total, color: 'bg-blue-50 text-blue-700', icon: '📋', href: '/dashboard/admin/requests' },
          { label: 'Unassigned', value: stats.unassigned, color: 'bg-orange-50 text-orange-700', icon: '⏳', href: '/dashboard/admin/requests' },
          { label: 'In Progress', value: stats.in_progress, color: 'bg-yellow-50 text-yellow-700', icon: '🔧', href: '/dashboard/admin/assignments' },
          { label: 'Completed', value: stats.completed, color: 'bg-green-50 text-green-700', icon: '✅', href: '/dashboard/admin/requests' },
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

      {/* Recent requests */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">Recent Requests</h3>
          <button
            onClick={() => router.push('/dashboard/admin/requests')}
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
            <p className="text-gray-400 text-sm">No requests submitted yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {requests.map((req) => (
              <div
                key={req.id}
                onClick={() => router.push(`/dashboard/admin/requests/${req.id}`)}
                className="flex items-center justify-between px-6 py-4 cursor-pointer hover:bg-gray-50 transition-colors group"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 group-hover:text-blue-700 transition-colors truncate">
                    {req.title}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {req.profiles?.full_name ?? 'Unknown'} · {req.request_categories?.name ?? 'General'} · {formatDate(req.created_at)}
                  </p>
                </div>
                <div className="flex items-center gap-2 ml-4 shrink-0">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${PRIORITY_STYLES[req.priority]}`}>
                    {req.priority}
                  </span>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_STYLES[req.status]}`}>
                    {STATUS_LABELS[req.status]}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'View All Requests', href: '/dashboard/admin/requests', icon: '📋', desc: 'Manage and filter all requests' },
          { label: 'Manage Assignments', href: '/dashboard/admin/assignments', icon: '👥', desc: 'Assign officers to requests' },
          { label: 'View Activity Logs', href: '/dashboard/admin/logs', icon: '📊', desc: 'Track all system activity' },
        ].map((action) => (
          <button
            key={action.href}
            onClick={() => router.push(action.href)}
            className="flex items-start gap-4 p-5 bg-white rounded-2xl border border-gray-100 shadow-sm hover:border-blue-200 hover:shadow-md transition-all text-left"
          >
            <span className="text-2xl">{action.icon}</span>
            <div>
              <p className="font-semibold text-gray-900 text-sm">{action.label}</p>
              <p className="text-xs text-gray-500 mt-0.5">{action.desc}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}