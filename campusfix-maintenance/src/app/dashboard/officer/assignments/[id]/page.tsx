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
  request_categories: { name: string } | null
  profiles: { full_name: string; email: string } | null
  assignments: {
    notes: string | null
    due_at: string | null
    assigned_at: string
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

const STATUS_ICONS: Record<string, string> = {
  submitted:   '📋',
  assigned:    '👤',
  in_progress: '🔧',
  completed:   '✅',
  closed:      '🔒',
  rejected:    '❌',
}

const PRIORITY_STYLES: Record<string, string> = {
  low:    'bg-gray-100 text-gray-600',
  medium: 'bg-blue-50 text-blue-600',
  high:   'bg-orange-50 text-orange-600',
  urgent: 'bg-red-50 text-red-600',
}

// Officer can only move to these statuses
const ALLOWED_STATUSES = ['in_progress', 'completed']

export default function OfficerAssignmentDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [request, setRequest] = useState<RequestDetail | null>(null)
  const [statusUpdates, setStatusUpdates] = useState<StatusUpdate[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  const [newStatus, setNewStatus] = useState('')
  const [comment, setComment] = useState('')
  const [updating, setUpdating] = useState(false)
  const [updateError, setUpdateError] = useState('')
  const [updateSuccess, setUpdateSuccess] = useState(false)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  async function fetchData() {
    const { data: req, error } = await supabase
      .from('service_requests')
      .select(`
        id, title, description, location, priority,
        status, evidence_url, created_at,
        request_categories(name),
        profiles(full_name, email),
        assignments(notes, due_at, assigned_at)
      `)
      .eq('id', id)
      .single()

    if (error || !req) { setNotFound(true); setLoading(false); return }
    setRequest(req as unknown as RequestDetail)

    const { data: updates } = await supabase
      .from('status_updates')
      .select('id, old_status, new_status, comment, created_at, profiles(full_name)')
      .eq('request_id', id)
      .order('created_at', { ascending: false })

    if (updates) setStatusUpdates(updates as unknown as StatusUpdate[])
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [id])

  async function handleStatusUpdate(e: React.FormEvent) {
    e.preventDefault()
    setUpdateError('')
    setUpdateSuccess(false)

    if (!newStatus) { setUpdateError('Please select a status.'); return }
    setUpdating(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error: updateErr } = await supabase
      .from('service_requests')
      .update({ status: newStatus })
      .eq('id', id)

    if (updateErr) { setUpdateError(updateErr.message); setUpdating(false); return }

    await supabase.from('status_updates').insert({
      request_id: id,
      updated_by: user.id,
      old_status: request?.status,
      new_status: newStatus,
      comment: comment || null,
    })

    await fetchData()
    setUpdating(false)
    setNewStatus('')
    setComment('')
    setUpdateSuccess(true)
    setTimeout(() => setUpdateSuccess(false), 3000)
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('en-NG', {
      day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    })
  }

  const assignment = request?.assignments?.[0] ?? null
  const isFinished = ['completed', 'closed', 'rejected'].includes(request?.status ?? '')

  if (loading) return (
    <div className="flex items-center justify-center py-24">
      <svg className="animate-spin text-gray-400" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
      </svg>
    </div>
  )

  if (notFound || !request) return (
    <div className="text-center py-24">
      <h3 className="text-lg font-semibold text-gray-900 mb-2">Assignment not found</h3>
      <button onClick={() => router.push('/dashboard/officer/assignments')}
        className="px-5 py-2.5 rounded-xl text-white text-sm font-semibold mt-4"
        style={{ background: 'linear-gradient(135deg, #1a4a7a, #0f2942)' }}>
        Back to My Assignments
      </button>
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Back */}
      <button onClick={() => router.push('/dashboard/officer/assignments')}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
        </svg>
        Back to My Assignments
      </button>

      {/* Request details */}
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
            <p className="text-xs text-gray-400 mb-0.5">Requested by</p>
            <p className="text-sm font-medium text-gray-700">{request.profiles?.full_name ?? 'Unknown'}</p>
          </div>
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
          {assignment?.due_at && (
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Due by</p>
              <p className={`text-sm font-medium ${new Date(assignment.due_at) < new Date() && !isFinished ? 'text-red-600' : 'text-gray-700'}`}>
                {formatDate(assignment.due_at)}
              </p>
            </div>
          )}
          {assignment?.notes && (
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Admin notes</p>
              <p className="text-sm font-medium text-gray-700">{assignment.notes}</p>
            </div>
          )}
        </div>

        {request.evidence_url && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <a href={request.evidence_url} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
              </svg>
              View Evidence
            </a>
          </div>
        )}
      </div>

      {/* Update status */}
      {!isFinished && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
            Update Progress
          </h3>

          <form onSubmit={handleStatusUpdate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                New Status <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                {ALLOWED_STATUSES
                  .filter(s => s !== request.status)
                  .map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setNewStatus(s)}
                      className={`p-3 rounded-xl border-2 text-sm font-medium transition-all text-left ${
                        newStatus === s
                          ? 'border-blue-600 bg-blue-50 text-blue-700'
                          : 'border-gray-100 bg-gray-50 text-gray-600 hover:border-gray-200'
                      }`}
                    >
                      <span className="block text-lg mb-1">{STATUS_ICONS[s]}</span>
                      {STATUS_LABELS[s]}
                    </button>
                  ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Progress note (optional)
              </label>
              <textarea
                rows={3}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Describe what was done, what's pending, or any issues found..."
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 placeholder-gray-400 focus:outline-none transition-all resize-none"
                onFocus={(e) => e.target.style.boxShadow = '0 0 0 3px rgba(26,74,122,0.15)'}
                onBlur={(e) => e.target.style.boxShadow = 'none'}
              />
            </div>

            {updateError && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-100 px-4 py-3 rounded-xl">{updateError}</p>
            )}

            {updateSuccess && (
              <p className="text-sm text-green-600 bg-green-50 border border-green-100 px-4 py-3 rounded-xl">
                ✅ Status updated successfully.
              </p>
            )}

            <button type="submit" disabled={updating}
              className="px-6 py-2.5 rounded-xl text-white text-sm font-semibold transition-all disabled:opacity-60"
              style={{ background: updating ? '#93a3b8' : 'linear-gradient(135deg, #1a4a7a, #0f2942)' }}>
              {updating ? 'Updating...' : 'Update Status'}
            </button>
          </form>
        </div>
      )}

      {isFinished && (
        <div className="p-4 rounded-xl bg-green-50 border border-green-100 text-sm text-green-800 font-medium">
          ✅ This request has been {STATUS_LABELS[request.status].toLowerCase()}. No further updates needed.
        </div>
      )}

      {/* Status history */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Status History</h3>
        {statusUpdates.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-4">No updates yet — be the first to update progress.</p>
        ) : (
          <div className="space-y-4">
            {statusUpdates.map((update, index) => (
              <div key={update.id} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm bg-gray-100">
                    {STATUS_ICONS[update.new_status] ?? '📋'}
                  </div>
                  {index < statusUpdates.length - 1 && <div className="w-px flex-1 bg-gray-100 mt-2" />}
                </div>
                <div className="flex-1 pb-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_STYLES[update.new_status]}`}>
                      {STATUS_LABELS[update.new_status]}
                    </span>
                    {update.old_status && (
                      <span className="text-xs text-gray-400">from {STATUS_LABELS[update.old_status]}</span>
                    )}
                  </div>
                  {update.comment && <p className="text-sm text-gray-600 mt-1">{update.comment}</p>}
                  <p className="text-xs text-gray-400 mt-1">
                    {update.profiles?.full_name ?? 'System'} · {formatDate(update.created_at)}
                  </p>
                </div>
              </div>
            ))}
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm bg-gray-100">📋</div>
              <div className="flex-1">
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">Submitted</span>
                <p className="text-xs text-gray-400 mt-1">{request.profiles?.full_name ?? 'User'} · {formatDate(request.created_at)}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}