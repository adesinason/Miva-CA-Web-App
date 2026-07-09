'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'

type Officer = {
  id: string
  full_name: string
  email: string
}

type Assignment = {
  id: string
  notes: string | null
  due_at: string | null
  assigned_at: string
  profiles: { full_name: string } | null
}

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

export default function AdminRequestDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [request, setRequest] = useState<RequestDetail | null>(null)
  const [assignment, setAssignment] = useState<Assignment | null>(null)
  const [statusUpdates, setStatusUpdates] = useState<StatusUpdate[]>([])
  const [officers, setOfficers] = useState<Officer[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  // Assign officer form state
  const [selectedOfficer, setSelectedOfficer] = useState('')
  const [assignNotes, setAssignNotes] = useState('')
  const [dueAt, setDueAt] = useState('')
  const [assigning, setAssigning] = useState(false)
  const [assignError, setAssignError] = useState('')

  // Status update form state
  const [newStatus, setNewStatus] = useState('')
  const [statusComment, setStatusComment] = useState('')
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [statusError, setStatusError] = useState('')

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  async function fetchData() {
    const { data: req, error } = await supabase
      .from('service_requests')
      .select('id, title, description, location, priority, status, evidence_url, created_at, updated_at, request_categories(name), profiles(full_name, email)')
      .eq('id', id)
      .single()

    if (error || !req) { setNotFound(true); setLoading(false); return }
    setRequest(req as unknown as RequestDetail)

    const { data: assign } = await supabase
      .from('assignments')
      .select('id, notes, due_at, assigned_at, profiles(full_name)')
      .eq('request_id', id)
      .single()

    if (assign) setAssignment(assign as unknown as Assignment)

    const { data: updates } = await supabase
      .from('status_updates')
      .select('id, old_status, new_status, comment, created_at, profiles(full_name)')
      .eq('request_id', id)
      .order('created_at', { ascending: false })

    if (updates) setStatusUpdates(updates as unknown as StatusUpdate[])

    const { data: officerList } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .eq('role_id', 2)
      .order('full_name')

    if (officerList) setOfficers(officerList as Officer[])
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [id])

  async function handleAssign(e: React.FormEvent) {
    e.preventDefault()
    setAssignError('')
    if (!selectedOfficer) { setAssignError('Please select an officer.'); return }
    setAssigning(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Upsert assignment
    const { error: assignError } = await supabase
      .from('assignments')
      .upsert({
        request_id: id,
        officer_id: selectedOfficer,
        assigned_by: user.id,
        notes: assignNotes || null,
        due_at: dueAt || null,
      }, { onConflict: 'request_id' })

    if (assignError) { setAssignError(assignError.message); setAssigning(false); return }

    // Update request status to assigned
    await supabase
      .from('service_requests')
      .update({ status: 'assigned' })
      .eq('id', id)

    // Log status update
    await supabase.from('status_updates').insert({
      request_id: id,
      updated_by: user.id,
      old_status: request?.status,
      new_status: 'assigned',
      comment: `Assigned to officer. ${assignNotes || ''}`.trim(),
    })

    await fetchData()
    setAssigning(false)
    setSelectedOfficer('')
    setAssignNotes('')
    setDueAt('')
  }

  async function handleStatusUpdate(e: React.FormEvent) {
    e.preventDefault()
    setStatusError('')
    if (!newStatus) { setStatusError('Please select a status.'); return }
    setUpdatingStatus(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error: updateError } = await supabase
      .from('service_requests')
      .update({ status: newStatus })
      .eq('id', id)

    if (updateError) { setStatusError(updateError.message); setUpdatingStatus(false); return }

    await supabase.from('status_updates').insert({
      request_id: id,
      updated_by: user.id,
      old_status: request?.status,
      new_status: newStatus,
      comment: statusComment || null,
    })

    await fetchData()
    setUpdatingStatus(false)
    setNewStatus('')
    setStatusComment('')
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('en-NG', {
      day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    })
  }

  if (loading) return (
    <div className="flex items-center justify-center py-24">
      <svg className="animate-spin text-gray-400" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
      </svg>
    </div>
  )

  if (notFound || !request) return (
    <div className="text-center py-24">
      <h3 className="text-lg font-semibold text-gray-900 mb-2">Request not found</h3>
      <button onClick={() => router.push('/dashboard/admin/requests')}
        className="px-5 py-2.5 rounded-xl text-white text-sm font-semibold mt-4"
        style={{ background: 'linear-gradient(135deg, #1a4a7a, #0f2942)' }}>
        Back to All Requests
      </button>
    </div>
  )

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {/* Back */}
      <button onClick={() => router.push('/dashboard/admin/requests')}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
        </svg>
        Back to All Requests
      </button>

      {/* Request info */}
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

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4 border-t border-gray-100">
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Submitted by</p>
            <p className="text-sm font-medium text-gray-700">{request.profiles?.full_name ?? 'Unknown'}</p>
            <p className="text-xs text-gray-400">{request.profiles?.email}</p>
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
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Last Updated</p>
            <p className="text-sm font-medium text-gray-700">{formatDate(request.updated_at)}</p>
          </div>
          {request.evidence_url && (
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Evidence</p>
              <a href={request.evidence_url} target="_blank" rel="noopener noreferrer"
                className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  <polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
                </svg>
                View
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Assign Officer */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
          {assignment ? 'Reassign Officer' : 'Assign Officer'}
        </h3>

        {assignment && (
          <div className="mb-4 p-4 rounded-xl bg-blue-50 border border-blue-100">
            <p className="text-sm text-blue-800">
              <span className="font-medium">Currently assigned to:</span> {assignment.profiles?.full_name ?? 'Unknown'}
            </p>
            {assignment.due_at && (
              <p className="text-sm text-blue-700 mt-1">
                <span className="font-medium">Due:</span> {formatDate(assignment.due_at)}
              </p>
            )}
            {assignment.notes && (
              <p className="text-sm text-blue-700 mt-1">
                <span className="font-medium">Notes:</span> {assignment.notes}
              </p>
            )}
          </div>
        )}

        <form onSubmit={handleAssign} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Select Officer <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedOfficer}
              onChange={(e) => setSelectedOfficer(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 focus:outline-none transition-all"
              onFocus={(e) => e.target.style.boxShadow = '0 0 0 3px rgba(26,74,122,0.15)'}
              onBlur={(e) => e.target.style.boxShadow = 'none'}
            >
              <option value="">Choose a maintenance officer...</option>
              {officers.map((o) => (
                <option key={o.id} value={o.id}>{o.full_name} — {o.email}</option>
              ))}
            </select>
            {officers.length === 0 && (
              <p className="text-xs text-orange-500 mt-1">No maintenance officers found. Create officer accounts first.</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Due Date (optional)</label>
              <input
                type="datetime-local"
                value={dueAt}
                onChange={(e) => setDueAt(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 focus:outline-none transition-all"
                onFocus={(e) => e.target.style.boxShadow = '0 0 0 3px rgba(26,74,122,0.15)'}
                onBlur={(e) => e.target.style.boxShadow = 'none'}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Notes (optional)</label>
              <input
                type="text"
                value={assignNotes}
                onChange={(e) => setAssignNotes(e.target.value)}
                placeholder="Any special instructions..."
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 focus:outline-none transition-all"
                onFocus={(e) => e.target.style.boxShadow = '0 0 0 3px rgba(26,74,122,0.15)'}
                onBlur={(e) => e.target.style.boxShadow = 'none'}
              />
            </div>
          </div>

          {assignError && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 px-4 py-3 rounded-xl">{assignError}</p>
          )}

          <button type="submit" disabled={assigning}
            className="px-6 py-2.5 rounded-xl text-white text-sm font-semibold transition-all disabled:opacity-60"
            style={{ background: assigning ? '#93a3b8' : 'linear-gradient(135deg, #1a4a7a, #0f2942)' }}>
            {assigning ? 'Assigning...' : assignment ? 'Reassign Officer' : 'Assign Officer'}
          </button>
        </form>
      </div>

      {/* Update Status */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" />
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
          </svg>
          Update Status
        </h3>

        <form onSubmit={handleStatusUpdate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              New Status <span className="text-red-500">*</span>
            </label>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 focus:outline-none transition-all"
              onFocus={(e) => e.target.style.boxShadow = '0 0 0 3px rgba(26,74,122,0.15)'}
              onBlur={(e) => e.target.style.boxShadow = 'none'}
            >
              <option value="">Select new status...</option>
              {Object.entries(STATUS_LABELS)
                .filter(([key]) => key !== request.status)
                .map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Comment (optional)</label>
            <textarea
              rows={3}
              value={statusComment}
              onChange={(e) => setStatusComment(e.target.value)}
              placeholder="Add a note about this status change..."
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 placeholder-gray-400 focus:outline-none transition-all resize-none"
              onFocus={(e) => e.target.style.boxShadow = '0 0 0 3px rgba(26,74,122,0.15)'}
              onBlur={(e) => e.target.style.boxShadow = 'none'}
            />
          </div>

          {statusError && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 px-4 py-3 rounded-xl">{statusError}</p>
          )}

          <button type="submit" disabled={updatingStatus}
            className="px-6 py-2.5 rounded-xl text-white text-sm font-semibold transition-all disabled:opacity-60"
            style={{ background: updatingStatus ? '#93a3b8' : 'linear-gradient(135deg, #1a4a7a, #0f2942)' }}>
            {updatingStatus ? 'Updating...' : 'Update Status'}
          </button>
        </form>
      </div>

      {/* Status history */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Status History</h3>
        {statusUpdates.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-4">No status updates yet.</p>
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