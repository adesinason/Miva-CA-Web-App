'use client'

import { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'

type Profile = {
  id: string
  full_name: string
  email: string
  matric_staff_no: string | null
  phone: string | null
  department: string | null
  role_id: number
  created_at: string
}

const ROLE_LABELS: Record<number, string> = {
  1: 'Student / Staff',
  2: 'Maintenance Officer',
  3: 'Administrator',
}

const ROLE_BADGE: Record<number, string> = {
  1: 'bg-green-100 text-green-700',
  2: 'bg-blue-100 text-blue-700',
  3: 'bg-purple-100 text-purple-700',
}

const DEPARTMENTS = [
  'Computer Science', 'Engineering', 'Business Administration',
  'Law', 'Medicine', 'Arts & Humanities', 'Sciences',
  'Social Sciences', 'Administration & Staff', 'Other',
]

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [saveSuccess, setSaveSuccess] = useState(false)

  const [form, setForm] = useState({
    full_name: '',
    phone: '',
    department: '',
    matric_staff_no: '',
  })

  // Password change state
  const [changingPassword, setChangingPassword] = useState(false)
  const [passwords, setPasswords] = useState({ newPassword: '', confirmPassword: '' })
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    async function fetchProfile() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('profiles')
        .select('id, full_name, email, matric_staff_no, phone, department, role_id, created_at')
        .eq('id', user.id)
        .single()

      if (data) {
        setProfile(data as Profile)
        setForm({
          full_name: data.full_name ?? '',
          phone: data.phone ?? '',
          department: data.department ?? '',
          matric_staff_no: data.matric_staff_no ?? '',
        })
      }
      setLoading(false)
    }
    fetchProfile()
  }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaveError('')
    setSaveSuccess(false)
    setSaving(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: form.full_name,
        phone: form.phone || null,
        department: form.department || null,
        matric_staff_no: form.matric_staff_no || null,
      })
      .eq('id', user.id)

    if (error) {
      setSaveError(error.message)
      setSaving(false)
      return
    }

    setProfile(prev => prev ? { ...prev, ...form } : null)
    setSaving(false)
    setSaveSuccess(true)
    setEditing(false)
    setTimeout(() => setSaveSuccess(false), 3000)
  }

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault()
    setPasswordError('')
    setPasswordSuccess(false)

    if (passwords.newPassword !== passwords.confirmPassword) {
      setPasswordError('Passwords do not match.')
      return
    }
    if (passwords.newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters.')
      return
    }

    setChangingPassword(true)

    const { error } = await supabase.auth.updateUser({
      password: passwords.newPassword,
    })

    if (error) {
      setPasswordError(error.message)
      setChangingPassword(false)
      return
    }

    setPasswordSuccess(true)
    setPasswords({ newPassword: '', confirmPassword: '' })
    setChangingPassword(false)
    setTimeout(() => setPasswordSuccess(false), 3000)
  }

  function getInitials(name: string) {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('en-NG', {
      day: 'numeric', month: 'long', year: 'numeric'
    })
  }

  if (loading) return (
    <div className="flex items-center justify-center py-24">
      <svg className="animate-spin text-gray-400" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
      </svg>
    </div>
  )

  if (!profile) return null

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">My Profile</h2>
        <p className="text-gray-500 mt-1 text-sm">Manage your account information.</p>
      </div>

      {/* Avatar + role card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-xl font-bold shrink-0"
            style={{ background: 'linear-gradient(135deg, #1a4a7a, #0f2942)' }}>
            {getInitials(profile.full_name)}
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">{profile.full_name}</h3>
            <p className="text-sm text-gray-500">{profile.email}</p>
            <span className={`inline-block mt-2 px-2.5 py-1 rounded-full text-xs font-semibold ${ROLE_BADGE[profile.role_id]}`}>
              {ROLE_LABELS[profile.role_id]}
            </span>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-gray-100">
          <p className="text-xs text-gray-400">Member since {formatDate(profile.created_at)}</p>
        </div>
      </div>

      {/* Profile details */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold text-gray-900">Personal Information</h3>
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
              Edit
            </button>
          )}
        </div>

        {saveSuccess && (
          <div className="mb-4 p-3 rounded-xl bg-green-50 border border-green-100 text-sm text-green-700">
            ✅ Profile updated successfully.
          </div>
        )}

        {!editing ? (
          <div className="space-y-4">
            {[
              { label: 'Full Name', value: profile.full_name },
              { label: 'Email Address', value: profile.email },
              { label: 'Matric / Staff No.', value: profile.matric_staff_no ?? '—' },
              { label: 'Phone Number', value: profile.phone ?? '—' },
              { label: 'Department', value: profile.department ?? '—' },
            ].map((field) => (
              <div key={field.label} className="flex items-start justify-between py-3 border-b border-gray-50 last:border-0">
                <span className="text-sm text-gray-500 w-40 shrink-0">{field.label}</span>
                <span className="text-sm font-medium text-gray-900 text-right">{field.value}</span>
              </div>
            ))}
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
              <input
                type="text"
                required
                value={form.full_name}
                onChange={(e) => setForm(p => ({ ...p, full_name: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 focus:outline-none transition-all"
                onFocus={(e) => e.target.style.boxShadow = '0 0 0 3px rgba(26,74,122,0.15)'}
                onBlur={(e) => e.target.style.boxShadow = 'none'}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Matric / Staff No.</label>
              <input
                type="text"
                value={form.matric_staff_no}
                onChange={(e) => setForm(p => ({ ...p, matric_staff_no: e.target.value }))}
                placeholder="e.g. MU/2024/001"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 focus:outline-none transition-all"
                onFocus={(e) => e.target.style.boxShadow = '0 0 0 3px rgba(26,74,122,0.15)'}
                onBlur={(e) => e.target.style.boxShadow = 'none'}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone Number</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm(p => ({ ...p, phone: e.target.value }))}
                placeholder="+234 800 000 0000"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 focus:outline-none transition-all"
                onFocus={(e) => e.target.style.boxShadow = '0 0 0 3px rgba(26,74,122,0.15)'}
                onBlur={(e) => e.target.style.boxShadow = 'none'}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Department</label>
              <select
                value={form.department}
                onChange={(e) => setForm(p => ({ ...p, department: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 focus:outline-none transition-all"
                onFocus={(e) => e.target.style.boxShadow = '0 0 0 3px rgba(26,74,122,0.15)'}
                onBlur={(e) => e.target.style.boxShadow = 'none'}
              >
                <option value="">Select department</option>
                {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>

            {saveError && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-100 px-4 py-3 rounded-xl">{saveError}</p>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => { setEditing(false); setSaveError('') }}
                className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2.5 rounded-xl text-white text-sm font-semibold transition-all disabled:opacity-60"
                style={{ background: saving ? '#93a3b8' : 'linear-gradient(135deg, #1a4a7a, #0f2942)' }}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Change password */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h3 className="font-semibold text-gray-900 mb-5">Change Password</h3>

        {passwordSuccess && (
          <div className="mb-4 p-3 rounded-xl bg-green-50 border border-green-100 text-sm text-green-700">
            ✅ Password updated successfully.
          </div>
        )}

        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">New Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={passwords.newPassword}
                onChange={(e) => setPasswords(p => ({ ...p, newPassword: e.target.value }))}
                placeholder="At least 8 characters"
                className="w-full px-4 py-3 pr-12 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 focus:outline-none transition-all"
                onFocus={(e) => e.target.style.boxShadow = '0 0 0 3px rgba(26,74,122,0.15)'}
                onBlur={(e) => e.target.style.boxShadow = 'none'}
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showPassword
                  ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                }
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm New Password</label>
            <input
              type={showPassword ? 'text' : 'password'}
              required
              value={passwords.confirmPassword}
              onChange={(e) => setPasswords(p => ({ ...p, confirmPassword: e.target.value }))}
              placeholder="Repeat new password"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 focus:outline-none transition-all"
              onFocus={(e) => e.target.style.boxShadow = '0 0 0 3px rgba(26,74,122,0.15)'}
              onBlur={(e) => e.target.style.boxShadow = 'none'}
            />
          </div>

          {passwordError && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 px-4 py-3 rounded-xl">{passwordError}</p>
          )}

          <button
            type="submit"
            disabled={changingPassword}
            className="px-5 py-2.5 rounded-xl text-white text-sm font-semibold transition-all disabled:opacity-60"
            style={{ background: changingPassword ? '#93a3b8' : 'linear-gradient(135deg, #1a4a7a, #0f2942)' }}
          >
            {changingPassword ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  )
}