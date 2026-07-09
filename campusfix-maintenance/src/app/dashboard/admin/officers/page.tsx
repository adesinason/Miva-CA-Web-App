'use client'

import { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'

type Officer = {
  id: string
  full_name: string
  email: string
  phone: string | null
  department: string | null
  created_at: string
  assignment_count?: number
}

export default function AdminOfficersPage() {
  const [officers, setOfficers] = useState<Officer[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    async function fetchOfficers() {
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name, email, phone, department, created_at')
        .eq('role_id', 2)
        .order('full_name')

      if (!data) { setLoading(false); return }

      // Get assignment counts for each officer
      const officersWithCounts = await Promise.all(
        data.map(async (officer) => {
          const { count } = await supabase
            .from('assignments')
            .select('*', { count: 'exact', head: true })
            .eq('officer_id', officer.id)
          return { ...officer, assignment_count: count ?? 0 }
        })
      )

      setOfficers(officersWithCounts as Officer[])
      setLoading(false)
    }
    fetchOfficers()
  }, [])

  const filtered = officers.filter((o) =>
    search === '' ||
    o.full_name.toLowerCase().includes(search.toLowerCase()) ||
    o.email.toLowerCase().includes(search.toLowerCase()) ||
    (o.department ?? '').toLowerCase().includes(search.toLowerCase())
  )

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('en-NG', {
      day: 'numeric', month: 'short', year: 'numeric'
    })
  }

  function getInitials(name: string) {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Maintenance Officers</h2>
          <p className="text-gray-500 mt-1 text-sm">
            {loading ? 'Loading...' : `${filtered.length} officer${filtered.length !== 1 ? 's' : ''}`}
          </p>
        </div>
      </div>

      {/* How to add officers note */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-50 border border-blue-100">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1a4a7a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0">
          <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <p className="text-sm text-blue-800">
          To add a new officer, ask them to sign up normally at <strong>/auth/signup</strong>, then update their role in Supabase by setting <strong>role_id = 2</strong> in the profiles table.
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="text"
          placeholder="Search officers by name, email or department..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-900 placeholder-gray-400 focus:outline-none transition-all shadow-sm"
          onFocus={(e) => e.target.style.boxShadow = '0 0 0 3px rgba(26,74,122,0.15)'}
          onBlur={(e) => e.target.style.boxShadow = 'none'}
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <svg className="animate-spin text-gray-400" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
          </svg>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: 'linear-gradient(135deg, #e8f0fe, #c7d7f9)' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1a4a7a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            {search ? 'No officers match your search' : 'No officers yet'}
          </h3>
          <p className="text-gray-500 text-sm">
            {search ? 'Try a different search term.' : 'Officers will appear here once their accounts are assigned the officer role.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((officer) => (
            <div key={officer.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:border-blue-200 hover:shadow-md transition-all">
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
                  style={{ background: 'linear-gradient(135deg, #1a4a7a, #0f2942)' }}>
                  {getInitials(officer.full_name)}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate">{officer.full_name}</h3>
                  <p className="text-xs text-gray-500 truncate">{officer.email}</p>
                </div>
              </div>

              <div className="mt-4 space-y-2">
                {officer.department && (
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
                    </svg>
                    {officer.department}
                  </div>
                )}
                {officer.phone && (
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.34 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.29 6.29l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
                    </svg>
                    {officer.phone}
                  </div>
                )}
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                  Joined {formatDate(officer.created_at)}
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                <span className="text-xs text-gray-500">Total assignments</span>
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700">
                  {officer.assignment_count}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}