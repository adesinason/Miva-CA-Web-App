'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'

const DEPARTMENTS = [
  'Computer Science', 'Engineering', 'Business Administration',
  'Law', 'Medicine', 'Arts & Humanities', 'Sciences',
  'Social Sciences', 'Administration & Staff', 'Other',
]

const ROLES = [
  {
    id: 1,
    name: 'student_staff',
    label: 'Student / Staff',
    description: 'Submit and track maintenance requests',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
      </svg>
    ),
    color: 'border-green-400 bg-green-50 text-green-700',
    activeColor: 'border-green-500 bg-green-50',
  },
  {
    id: 2,
    name: 'maintenance_officer',
    label: 'Maintenance Officer',
    description: 'Handle and resolve assigned requests',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
      </svg>
    ),
    color: 'border-blue-400 bg-blue-50 text-blue-700',
    activeColor: 'border-blue-500 bg-blue-50',
  },
  {
    id: 3,
    name: 'administrator',
    label: 'Administrator',
    description: 'Manage all requests, officers and system',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.07 4.93l-1.41 1.41M4.93 4.93l1.41 1.41M4.93 19.07l1.41-1.41M19.07 19.07l-1.41-1.41M12 2v2M12 20v2M2 12h2M20 12h2" />
      </svg>
    ),
    color: 'border-purple-400 bg-purple-50 text-purple-700',
    activeColor: 'border-purple-500 bg-purple-50',
  },
]

export default function SignUpPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [selectedRole, setSelectedRole] = useState<number | null>(null)

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    matricStaffNo: '',
    phone: '',
    department: '',
    password: '',
    confirmPassword: '',
  })

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!selectedRole) {
      setError('Please select your role to continue.')
      return
    }
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }

    setLoading(true)

    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: {
          full_name: form.fullName,
          matric_staff_no: form.matricStaffNo,
          phone: form.phone,
          department: form.department,
          role_id: selectedRole,
        },
      },
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
    const role = ROLES.find(r => r.id === selectedRole)
    return (
      <div className="text-center space-y-4">
        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto"
          style={{ background: 'linear-gradient(135deg, #1a4a7a, #0f2942)' }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Account created!</h2>
        <p className="text-gray-500 text-sm leading-relaxed">
          We sent a confirmation link to <strong>{form.email}</strong>.<br />
          Click it to activate your <strong>{role?.label}</strong> account.
        </p>
        <p className="text-xs text-gray-400">
          After confirming, sign in and you&apos;ll be taken directly to your dashboard.
        </p>
        <Link
          href="/auth/signin"
          className="inline-block mt-4 px-6 py-3 rounded-xl text-white text-sm font-semibold"
          style={{ background: 'linear-gradient(135deg, #1a4a7a, #0f2942)' }}
        >
          Go to Sign In
        </Link>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Create account</h2>
        <p className="text-gray-500">Join CampusFix — select your role to get started.</p>
      </div>

      <form onSubmit={handleSignUp} className="space-y-5">

        {/* Role selector */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            I am a <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-1 gap-2">
            {ROLES.map((role) => (
              <button
                key={role.id}
                type="button"
                onClick={() => setSelectedRole(role.id)}
                className={`flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all ${
                  selectedRole === role.id
                    ? `${role.activeColor} border-current shadow-sm`
                    : 'border-gray-100 bg-gray-50 hover:border-gray-200 hover:bg-gray-100'
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  selectedRole === role.id ? role.color : 'bg-white text-gray-400'
                }`}>
                  {role.icon}
                </div>
                <div>
                  <p className={`font-semibold text-sm ${selectedRole === role.id ? 'text-gray-900' : 'text-gray-700'}`}>
                    {role.label}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">{role.description}</p>
                </div>
                {selectedRole === role.id && (
                  <div className="ml-auto shrink-0">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1a4a7a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Full Name */}
        <div>
          <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1.5">
            Full name <span className="text-red-500">*</span>
          </label>
          <input
            id="fullName" name="fullName" type="text" required
            value={form.fullName} onChange={handleChange}
            placeholder="John Adeyemi"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none transition-all text-sm"
            onFocus={(e) => e.target.style.boxShadow = '0 0 0 3px rgba(26,74,122,0.15)'}
            onBlur={(e) => e.target.style.boxShadow = 'none'}
          />
        </div>

        {/* Email */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
            Email address <span className="text-red-500">*</span>
          </label>
          <input
            id="email" name="email" type="email" required
            value={form.email} onChange={handleChange}
            placeholder="you@miva.university"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none transition-all text-sm"
            onFocus={(e) => e.target.style.boxShadow = '0 0 0 3px rgba(26,74,122,0.15)'}
            onBlur={(e) => e.target.style.boxShadow = 'none'}
          />
        </div>

        {/* Matric / Staff + Phone */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="matricStaffNo" className="block text-sm font-medium text-gray-700 mb-1.5">
              Matric / Staff No.
            </label>
            <input
              id="matricStaffNo" name="matricStaffNo" type="text"
              value={form.matricStaffNo} onChange={handleChange}
              placeholder="MU/2024/001"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none transition-all text-sm"
              onFocus={(e) => e.target.style.boxShadow = '0 0 0 3px rgba(26,74,122,0.15)'}
              onBlur={(e) => e.target.style.boxShadow = 'none'}
            />
          </div>
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1.5">
              Phone number
            </label>
            <input
              id="phone" name="phone" type="tel"
              value={form.phone} onChange={handleChange}
              placeholder="+234 800 000 0000"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none transition-all text-sm"
              onFocus={(e) => e.target.style.boxShadow = '0 0 0 3px rgba(26,74,122,0.15)'}
              onBlur={(e) => e.target.style.boxShadow = 'none'}
            />
          </div>
        </div>

        {/* Department */}
        <div>
          <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-1.5">
            Department
          </label>
          <select
            id="department" name="department"
            value={form.department} onChange={handleChange}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 focus:outline-none transition-all text-sm appearance-none"
            onFocus={(e) => e.target.style.boxShadow = '0 0 0 3px rgba(26,74,122,0.15)'}
            onBlur={(e) => e.target.style.boxShadow = 'none'}
          >
            <option value="">Select your department</option>
            {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>

        {/* Password */}
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
            Password <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              id="password" name="password"
              type={showPassword ? 'text' : 'password'} required
              value={form.password} onChange={handleChange}
              placeholder="At least 8 characters"
              className="w-full px-4 py-3 pr-12 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none transition-all text-sm"
              onFocus={(e) => e.target.style.boxShadow = '0 0 0 3px rgba(26,74,122,0.15)'}
              onBlur={(e) => e.target.style.boxShadow = 'none'}
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
              {showPassword
                ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              }
            </button>
          </div>
        </div>

        {/* Confirm Password */}
        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1.5">
            Confirm password <span className="text-red-500">*</span>
          </label>
          <input
            id="confirmPassword" name="confirmPassword"
            type={showPassword ? 'text' : 'password'} required
            value={form.confirmPassword} onChange={handleChange}
            placeholder="Repeat your password"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none transition-all text-sm"
            onFocus={(e) => e.target.style.boxShadow = '0 0 0 3px rgba(26,74,122,0.15)'}
            onBlur={(e) => e.target.style.boxShadow = 'none'}
          />
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
        <button
          type="submit" disabled={loading}
          className="w-full py-3 px-6 rounded-xl text-white font-semibold text-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          style={{ background: loading ? '#93a3b8' : 'linear-gradient(135deg, #1a4a7a, #0f2942)' }}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
              Creating account...
            </span>
          ) : 'Create account'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500">
        Already have an account?{' '}
        <Link href="/auth/signin" className="font-semibold transition-colors" style={{ color: '#1a4a7a' }}>
          Sign in
        </Link>
      </p>
    </div>
  )
}