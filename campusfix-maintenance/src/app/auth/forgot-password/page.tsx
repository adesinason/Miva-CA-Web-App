'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createBrowserClient } from '@supabase/ssr'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  async function handleReset(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setSent(true)
    setLoading(false)
  }

  if (sent) {
    return (
      <div className="text-center space-y-4">
        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto"
          style={{ background: 'linear-gradient(135deg, #1a4a7a, #0f2942)' }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
            <polyline points="22,6 12,13 2,6" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Reset link sent</h2>
        <p className="text-gray-500 text-sm leading-relaxed">
          We sent a password reset link to <strong>{email}</strong>.<br />
          Check your inbox and follow the instructions.
        </p>
        <p className="text-xs text-gray-400">
          Didn&apos;t receive it? Check your spam folder or{' '}
          <button
            onClick={() => setSent(false)}
            className="font-medium underline"
            style={{ color: '#1a4a7a' }}
          >
            try again
          </button>
        </p>
        <Link
          href="/auth/signin"
          className="inline-block mt-2 px-6 py-3 rounded-xl text-white text-sm font-semibold"
          style={{ background: 'linear-gradient(135deg, #1a4a7a, #0f2942)' }}
        >
          Back to sign in
        </Link>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8">
        <Link
          href="/auth/signin"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors mb-6"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
          </svg>
          Back to sign in
        </Link>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Forgot password?</h2>
        <p className="text-gray-500">
          Enter your email and we&apos;ll send you a reset link.
        </p>
      </div>

      <form onSubmit={handleReset} className="space-y-5">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
            Email address
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@miva.university"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none transition-all text-sm"
            onFocus={(e) => e.target.style.boxShadow = '0 0 0 3px rgba(26,74,122,0.15)'}
            onBlur={(e) => e.target.style.boxShadow = 'none'}
          />
        </div>

        {error && (
          <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-100">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0">
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 px-6 rounded-xl text-white font-semibold text-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          style={{ background: loading ? '#93a3b8' : 'linear-gradient(135deg, #1a4a7a, #0f2942)' }}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
              Sending reset link...
            </span>
          ) : (
            'Send reset link'
          )}
        </button>
      </form>
    </div>
  )
}