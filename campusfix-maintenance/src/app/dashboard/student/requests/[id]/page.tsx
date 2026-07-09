'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'

type StatusUpdate = {
  id: string
  old_status: string | null
  new_status: string
  comment: string | null
  created_at: string
  profiles: { full_name: string } | null
}

type RequestDetail = {
  id: string
  title: string
  description: string
  location: string
  priority: string
  status: string
  evidence_url: string | null
  created_at: string
  updated_at: string
  request_categories: { name: string } | null
  assignments: {
    notes: string | null
    due_at: string | null
    assigned_at: string
    profiles: { full_name: string } | null
  }[] | null
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

const STATUS_ICONS: Record<string, string> = {
  submitted:   '📋',
  assigned:    '👤',
  in_progress: '🔧',
  completed:   '✅',
  closed:      '🔒',
  rejected:    '❌',
}

export default function RequestDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [request, setRequest] = useState<RequestDetail | null>(null)
  const [statusUpdates, setStatusUpdates] = useState<StatusUpdate[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    async function fetchData() {
      const { data: req, error } = await supabase
        .from('service_requests')
        .select(`
          id, title, description, location, priority,
          status, evidence_url, created_at, updated_at,
          request_categories(name),
          assignments(notes, due_at, assigned_at, profiles(full_name))
        `)
        .eq('id', id)
        .single()

      if (error || !req) {
        setNotFound(true)
        setLoading(false)
        return
      }

      setRequest(req as unknown as RequestDetail)

      const { data: updates } = await supabase
        .from('status_updates')
        .select('id, old_status, new_status, comment, created_at, profiles(full_name)')
        .eq('request_id', id)
        .order('created_at', { ascending: false })

      if (updates) setStatusUpdates(updates as unknown as StatusUpdate[])
      setLoading(false)
    }

    fetchData()
  }, [id])

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('en-NG', {
      day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <svg className="animate-spin text-gray-400" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 12a9 9 0 1 1-6.219-8.56" />
        </svg>
      </div>
    )
  }

  if (notFound || !request) {
    return (
      <div className="text-center py-24">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Request not found</h3>
        <p className="text-gray-500 text-sm mb-6">This request doesn&apos;t exist or you don&apos;t have access to it.</p>
        <button
          onClick={() => router.push('/dashboard/student/requests')}
          className="px-5 py-2.5 rounded-xl text-white text-sm font-semibold"
          style={{ background: 'linear-gradient(135deg, #1a4a7a, #0f2942)' }}
        >
          Back to My Requests
        </button>
      </div>
    )
  }

  const assignment = request.assignments?.[0] ?? null

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Back button */}
      <button
        onClick={() => router.push('/dashboard/student/requests')}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
        </svg>
        Back to My Requests
      </button>

      {/* Header */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex-1">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">
              {request.request_categories?.name ?? 'General'}
            </p>
            <h2 className="text-xl font-bold text-gray-900">{request.title}</h2>
          </div>
          <span className={`px-3 py-1.5 rounded-full text-sm font-semibold shrink-0 ${STATUS_STYLES[request.status]}`}>
            {STATUS_LABELS[request.status]}
          </span>
        </div>

        <p className="text-gray-600 text-sm leading-relaxed mb-4">{request.description}</p>

        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Location</p>
            <p className="text-sm font-medium text-gray-700">{request.location}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Priority</p>
            <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${PRIORITY_STYLES[request.priority]}`}>
              {request.priority}
            </span>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Submitted</p>
            <p className="text-sm font-medium text-gray-700">{formatDate(request.created_at)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Last Updated</p>
            <p className="text-sm font-medium text-gray-700">{formatDate(request.updated_at)}</p>
          </div>
        </div>

        {request.evidence_url && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-400 mb-1">Evidence</p>
            <a
              href={request.evidence_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
              </svg>
              View Evidence
            </a>
          </div>
        )}
      </div>

      {/* Assignment info */}
      {assignment && (
        <div className="bg-blue-50 rounded-2xl border border-blue-100 p-6">
          <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
            </svg>
            Assigned Officer
          </h3>
          <div className="space-y-2">
            <p className="text-sm text-blue-800">
              <span className="font-medium">Officer:</span> {assignment.profiles?.full_name ?? 'Unassigned'}
            </p>
            {assignment.due_at && (
              <p className="text-sm text-blue-800">
                <span className="font-medium">Due by:</span> {formatDate(assignment.due_at)}
              </p>
            )}
            {assignment.notes && (
              <p className="text-sm text-blue-800">
                <span className="font-medium">Notes:</span> {assignment.notes}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Status timeline */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Status History</h3>

        {statusUpdates.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-gray-400 text-sm">No status updates yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {statusUpdates.map((update, index) => (
              <div key={update.id} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm bg-gray-100">
                    {STATUS_ICONS[update.new_status] ?? '📋'}
                  </div>
                  {index < statusUpdates.length - 1 && (
                    <div className="w-px flex-1 bg-gray-100 mt-2" />
                  )}
                </div>
                <div className="flex-1 pb-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_STYLES[update.new_status]}`}>
                      {STATUS_LABELS[update.new_status]}
                    </span>
                    {update.old_status && (
                      <span className="text-xs text-gray-400">
                        from {STATUS_LABELS[update.old_status]}
                      </span>
                    )}
                  </div>
                  {update.comment && (
                    <p className="text-sm text-gray-600 mt-1">{update.comment}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">
                    {update.profiles?.full_name ?? 'System'} · {formatDate(update.created_at)}
                  </p>
                </div>
              </div>
            ))}

            {/* Initial submission */}
            <div className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm bg-gray-100">
                  📋
                </div>
              </div>
              <div className="flex-1">
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
                  Submitted
                </span>
                <p className="text-xs text-gray-400 mt-1">
                  You · {formatDate(request.created_at)}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}