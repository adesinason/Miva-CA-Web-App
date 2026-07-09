'use client'

import { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'

type Log = {
  id: string
  action: string
  entity_type: string
  entity_id: string | null
  details: Record<string, unknown> | null
  created_at: string
  profiles: { full_name: string; email: string } | null
}

const ACTION_STYLES: Record<string, string> = {
  create: 'bg-green-100 text-green-700',
  update: 'bg-blue-100 text-blue-700',
  delete: 'bg-red-100 text-red-700',
  assign: 'bg-purple-100 text-purple-700',
  login:  'bg-gray-100 text-gray-700',
}

export default function AdminLogsPage() {
  const [logs, setLogs] = useState<Log[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    async function fetchLogs() {
      const { data } = await supabase
        .from('activity_logs')
        .select('id, action, entity_type, entity_id, details, created_at, profiles(full_name, email)')
        .order('created_at', { ascending: false })
        .limit(100)

      if (data) setLogs(data as unknown as Log[])
      setLoading(false)
    }
    fetchLogs()
  }, [])

  const filtered = logs.filter((log) =>
    search === '' ||
    log.action.toLowerCase().includes(search.toLowerCase()) ||
    log.entity_type.toLowerCase().includes(search.toLowerCase()) ||
    (log.profiles?.full_name ?? '').toLowerCase().includes(search.toLowerCase())
  )

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('en-NG', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    })
  }

  function getActionStyle(action: string) {
    const key = Object.keys(ACTION_STYLES).find(k => action.toLowerCase().includes(k))
    return key ? ACTION_STYLES[key] : 'bg-gray-100 text-gray-600'
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Activity Logs</h2>
        <p className="text-gray-500 mt-1 text-sm">
          {loading ? 'Loading...' : `${filtered.length} log entries`}
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="text"
          placeholder="Search by action, entity, or user..."
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
              <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" />
              <line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" />
              <line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">No activity logs yet</h3>
          <p className="text-gray-500 text-sm">System activity will be recorded here automatically.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="divide-y divide-gray-50">
            {filtered.map((log) => (
              <div key={log.id} className="flex items-start gap-4 px-6 py-4 hover:bg-gray-50 transition-colors">
                <div className="shrink-0 mt-0.5">
                  <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${getActionStyle(log.action)}`}>
                    {log.action}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900">
                    <span className="font-medium">{log.profiles?.full_name ?? 'System'}</span>
                    {' — '}
                    <span className="text-gray-600 capitalize">{log.entity_type}</span>
                    {log.entity_id && (
                      <span className="text-gray-400 text-xs ml-1">
                        #{log.entity_id.slice(0, 8)}
                      </span>
                    )}
                  </p>
                  {log.profiles?.email && (
                    <p className="text-xs text-gray-400 mt-0.5">{log.profiles.email}</p>
                  )}
                  {log.details && Object.keys(log.details).length > 0 && (
                    <p className="text-xs text-gray-400 mt-1 font-mono bg-gray-50 px-2 py-1 rounded-lg">
                      {JSON.stringify(log.details)}
                    </p>
                  )}
                </div>
                <div className="shrink-0 text-xs text-gray-400 whitespace-nowrap">
                  {formatDate(log.created_at)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}