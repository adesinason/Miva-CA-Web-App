'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'

const CATEGORIES = [
  { id: 1, name: 'Electricity', icon: '⚡' },
  { id: 2, name: 'Plumbing', icon: '🔧' },
  { id: 3, name: 'Furniture', icon: '🪑' },
  { id: 4, name: 'Internet', icon: '📶' },
  { id: 5, name: 'Classroom Equipment', icon: '🖥️' },
  { id: 6, name: 'Hostel Maintenance', icon: '🏠' },
  { id: 7, name: 'General Maintenance', icon: '🔨' },
]

const PRIORITIES = [
  { value: 'low', label: 'Low', description: 'Not urgent, can wait', color: 'bg-gray-100 text-gray-700 border-gray-200' },
  { value: 'medium', label: 'Medium', description: 'Needs attention soon', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { value: 'high', label: 'High', description: 'Urgent, affects work', color: 'bg-orange-50 text-orange-700 border-orange-200' },
  { value: 'urgent', label: 'Urgent', description: 'Critical, fix immediately', color: 'bg-red-50 text-red-700 border-red-200' },
]

export default function NewRequestPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const [form, setForm] = useState({
    category_id: '',
    title: '',
    description: '',
    location: '',
    priority: 'medium',
    evidence_url: '',
  })

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  function selectCategory(id: number) {
    setForm((prev) => ({ ...prev, category_id: String(id) }))
  }

  function selectPriority(value: string) {
    setForm((prev) => ({ ...prev, priority: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!form.category_id) {
      setError('Please select a category.')
      return
    }

    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/auth/signin')
      return
    }

    const { error } = await supabase.from('service_requests').insert({
      requester_id: user.id,
      category_id: parseInt(form.category_id),
      title: form.title,
      description: form.description,
      location: form.location,
      priority: form.priority,
      evidence_url: form.evidence_url || null,
      status: 'submitted',
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)
  }

  if (success) {
    return (
      <div className="max-w-lg mx-auto text-center py-16 space-y-4">
        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto"
          style={{ background: 'linear-gradient(135deg, #1a4a7a, #0f2942)' }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Request Submitted!</h2>
        <p className="text-gray-500 text-sm leading-relaxed">
          Your maintenance request has been submitted successfully. You can track its status in <strong>My Requests</strong>.
        </p>
        <div className="flex gap-3 justify-center pt-2">
          <button
            onClick={() => { setSuccess(false); setForm({ category_id: '', title: '', description: '', location: '', priority: 'medium', evidence_url: '' }) }}
            className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all"
          >
            New Request
          </button>
          <button
            onClick={() => router.push('/dashboard/student/requests')}
            className="px-5 py-2.5 rounded-xl text-white text-sm font-semibold transition-all"
            style={{ background: 'linear-gradient(135deg, #1a4a7a, #0f2942)' }}
          >
            View My Requests
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">New Maintenance Request</h2>
        <p className="text-gray-500 mt-1 text-sm">Fill in the details below and we&apos;ll assign someone to fix it.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Category */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="font-semibold text-gray-900 mb-4">What type of issue is this?</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => selectCategory(cat.id)}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 text-sm font-medium transition-all ${
                  form.category_id === String(cat.id)
                    ? 'border-blue-600 bg-blue-50 text-blue-700'
                    : 'border-gray-100 bg-gray-50 text-gray-600 hover:border-gray-200 hover:bg-gray-100'
                }`}
              >
                <span className="text-2xl">{cat.icon}</span>
                <span className="text-center leading-tight">{cat.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Title & Location */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
          <h3 className="font-semibold text-gray-900">Request Details</h3>

          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1.5">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              id="title"
              name="title"
              type="text"
              required
              value={form.title}
              onChange={handleChange}
              placeholder="e.g. Broken socket in Room 204"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white transition-all text-sm"
              onFocus={(e) => e.target.style.boxShadow = '0 0 0 3px rgba(26,74,122,0.15)'}
              onBlur={(e) => e.target.style.boxShadow = 'none'}
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1.5">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              id="description"
              name="description"
              required
              rows={4}
              value={form.description}
              onChange={handleChange}
              placeholder="Describe the issue in detail — when did it start, how bad is it, what has been affected..."
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white transition-all text-sm resize-none"
              onFocus={(e) => e.target.style.boxShadow = '0 0 0 3px rgba(26,74,122,0.15)'}
              onBlur={(e) => e.target.style.boxShadow = 'none'}
            />
          </div>

          <div>
            <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1.5">
              Location <span className="text-red-500">*</span>
            </label>
            <input
              id="location"
              name="location"
              type="text"
              required
              value={form.location}
              onChange={handleChange}
              placeholder="e.g. Block C, Room 204, 2nd Floor"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white transition-all text-sm"
              onFocus={(e) => e.target.style.boxShadow = '0 0 0 3px rgba(26,74,122,0.15)'}
              onBlur={(e) => e.target.style.boxShadow = 'none'}
            />
          </div>

          <div>
            <label htmlFor="evidence_url" className="block text-sm font-medium text-gray-700 mb-1.5">
              Evidence URL <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              id="evidence_url"
              name="evidence_url"
              type="url"
              value={form.evidence_url}
              onChange={handleChange}
              placeholder="https://drive.google.com/... or https://imgur.com/..."
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white transition-all text-sm"
              onFocus={(e) => e.target.style.boxShadow = '0 0 0 3px rgba(26,74,122,0.15)'}
              onBlur={(e) => e.target.style.boxShadow = 'none'}
            />
            <p className="text-xs text-gray-400 mt-1">Link to a photo or video of the issue (Google Drive, Imgur, etc.)</p>
          </div>
        </div>

        {/* Priority */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="font-semibold text-gray-900 mb-4">How urgent is this?</h3>
          <div className="grid grid-cols-2 gap-3">
            {PRIORITIES.map((p) => (
              <button
                key={p.value}
                type="button"
                onClick={() => selectPriority(p.value)}
                className={`flex flex-col gap-1 p-4 rounded-xl border-2 text-left transition-all ${
                  form.priority === p.value
                    ? p.color + ' border-current'
                    : 'border-gray-100 bg-gray-50 text-gray-600 hover:border-gray-200'
                }`}
              >
                <span className="font-semibold text-sm">{p.label}</span>
                <span className="text-xs opacity-75">{p.description}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-100">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0">
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Submit */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 py-3 px-6 rounded-xl text-white font-semibold text-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            style={{ background: loading ? '#93a3b8' : 'linear-gradient(135deg, #1a4a7a, #0f2942)' }}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
                Submitting...
              </span>
            ) : (
              'Submit Request'
            )}
          </button>
        </div>
      </form>
    </div>
  )
}