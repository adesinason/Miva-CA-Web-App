'use client'

import { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'

type Notification = {
  id: string
  title: string
  message: string
  is_read: boolean
  created_at: string
  request_id: string | null
}

type NotificationsPageProps = {
  role: 'student' | 'officer' | 'admin'
}

export default function NotificationsPage({ role }: NotificationsPageProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const [markingAll, setMarkingAll] = useState(false)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  async function fetchNotifications() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('notifications')
      .select('id, title, message, is_read, created_at, request_id')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (data) setNotifications(data as Notification[])
    setLoading(false)
  }

  useEffect(() => { fetchNotifications() }, [])

  async function markAsRead(id: string) {
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id)

    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, is_read: true } : n)
    )
  }

  async function markAllAsRead() {
    setMarkingAll(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false)

    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
    setMarkingAll(false)
  }

  const filtered = filter === 'unread'
    ? notifications.filter(n => !n.is_read)
    : notifications

  const unreadCount = notifications.filter(n => !n.is_read).length

  function formatDate(dateStr: string) {
    const date = new Date(dateStr)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    if (days < 7) return `${days}d ago`
    return date.toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  function getDashboardPath(requestId: string | null) {
    if (!requestId) return null
    if (role === 'admin') return `/dashboard/admin/requests/${requestId}`
    if (role === 'officer') return `/dashboard/officer/assignments/${requestId}`
    return `/dashboard/student/requests/${requestId}`
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Notifications</h2>
          <p className="text-gray-500 mt-1 text-sm">
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}` : 'All caught up'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            disabled={markingAll}
            className="text-sm font-medium transition-colors disabled:opacity-50"
            style={{ color: '#1a4a7a' }}
          >
            {markingAll ? 'Marking...' : 'Mark all as read'}
          </button>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {[
          { key: 'all', label: 'All', count: notifications.length },
          { key: 'unread', label: 'Unread', count: unreadCount },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key as 'all' | 'unread')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all border ${
              filter === tab.key
                ? 'text-white border-transparent'
                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
            }`}
            style={filter === tab.key ? { background: 'linear-gradient(135deg, #1a4a7a, #0f2942)' } : {}}
          >
            {tab.label}
            <span className={`px-1.5 py-0.5 rounded-full text-xs font-bold ${
              filter === tab.key ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
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
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
          </h3>
          <p className="text-gray-500 text-sm">
            {filter === 'unread' ? 'You\'re all caught up!' : 'Notifications about your requests will appear here.'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="divide-y divide-gray-50">
            {filtered.map((notif) => {
              const href = getDashboardPath(notif.request_id)
              return (
                <div
                  key={notif.id}
                  className={`flex items-start gap-4 px-6 py-4 transition-colors cursor-pointer hover:bg-gray-50 ${
                    !notif.is_read ? 'bg-blue-50/40' : ''
                  }`}
                  onClick={() => {
                    if (!notif.is_read) markAsRead(notif.id)
                    if (href) window.location.href = href
                  }}
                >
                  {/* Unread dot */}
                  <div className="shrink-0 mt-1.5">
                    {!notif.is_read ? (
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#1a4a7a' }} />
                    ) : (
                      <div className="w-2.5 h-2.5 rounded-full bg-gray-200" />
                    )}
                  </div>

                  {/* Icon */}
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    !notif.is_read ? 'bg-blue-100' : 'bg-gray-100'
                  }`}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                      stroke={!notif.is_read ? '#1a4a7a' : '#9ca3af'}
                      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                    </svg>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${!notif.is_read ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>
                      {notif.title}
                    </p>
                    <p className="text-sm text-gray-500 mt-0.5 leading-relaxed">{notif.message}</p>
                    {href && (
                      <p className="text-xs mt-1.5 font-medium" style={{ color: '#1a4a7a' }}>
                        View request →
                      </p>
                    )}
                  </div>

                  {/* Time */}
                  <div className="shrink-0 text-xs text-gray-400 whitespace-nowrap">
                    {formatDate(notif.created_at)}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}