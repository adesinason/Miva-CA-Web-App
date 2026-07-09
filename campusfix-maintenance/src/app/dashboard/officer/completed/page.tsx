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
    updated_at: string
    request_categories: { name: string } | null
    profiles: { full_name: string } | null
  } | null
}

export default function OfficerCompletedPage() {
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
          service_requests(id, title, status, priority, location, updated_at,
            request_categories(name),
            profiles(full_name)
          )
        `)
        .eq('officer_id', user.id)
        .order('assigned_at', { ascending: false })

      if (data) {
        const completed = (data as unknown as Assignment[]).filter(
          a => ['completed', 'closed'].includes(a.service_requests?.status ?? '')
        )
        setAssignments(completed)
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

  function wasOnTime(due_at: string | null, updated_at: string) {
    if (!due_at) return null
    return new Date(updated_at) <= new Date(due_at)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Completed</h2>
        <p className="text-gray-500 mt-1 text-sm">
          {loading ? 'Loading...' : `${assignments.length} completed task${assignments.length !== 1 ? 's' : ''}`}
        </p>
      </div>

      {/* Summary banner */}
      {!loading && assignments.length > 0 && (
        <div className="rounded-2xl p-5 text-white" style={{ background: 'linear-gradient(135deg, #1a4a7a, #0f2942)' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-200 text-sm">Total completed</p>
              <p className="text-3xl font-bold mt-0.5">{assignments.length}</p>
            </div>
            <div className="text-right">
              <p className="text-blue-200 text-sm">On time</p>
              <p className="text-3xl font-bold mt-0.5">
                {assignments.filter(a =>
                  wasOnTime(a.due_at, a.service_requests?.updated_at ?? '') === true
                ).length}
              </p>
            </div>
            <div className="w-16 h-16 rounded-full flex items-center justify-center text-3xl"
              style={{ background: 'rgba(255,255,255,0.1)' }}>
              ✅
            </div>
          </div>
        </div>
      )}

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
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">No completed tasks yet</h3>
          <p className="text-gray-500 text-sm">Tasks you complete will appear here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {assignments.map((a) => {
            const req = a.service_requests
            const onTime = wasOnTime(a.due_at, req?.updated_at ?? '')
            return (
              <div
                key={a.id}
                onClick={() => req && router.push(`/dashboard/officer/assignments/${req.id}`)}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 cursor-pointer hover:border-blue-200 hover:shadow-md transition-all group"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                        {req?.request_categories?.name ?? 'General'}
                      </span>
                      {onTime === true && (
                        <span className="px-1.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                          ✅ On time
                        </span>
                      )}
                      {onTime === false && (
                        <span className="px-1.5 py-0.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-700">
                          ⏰ Late
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
                      <span>Completed: {formatDate(req?.updated_at ?? '')}</span>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700 shrink-0">
                    {req?.status === 'closed' ? 'Closed' : 'Completed'}
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