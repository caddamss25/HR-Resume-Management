import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import { timeAgo } from '../utils/formatDate'

export default function Navbar({ onMenuClick }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [notifOpen, setNotifOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [loadingNotifs, setLoadingNotifs] = useState(false)
  const [dismissedIds, setDismissedIds] = useState(() => {
    const saved = localStorage.getItem('rms_dismissed_notifs')
    return saved ? JSON.parse(saved) : []
  })

  const handleSearch = (e) => {
    if (e.key === 'Enter' && search.trim()) {
      navigate(`/search?keyword=${encodeURIComponent(search.trim())}`)
    }
  }

  const fetchNotifications = async () => {
    setLoadingNotifs(true)
    try {
      const res = await api.get('/api/resumes/recent?count=10')
      // Filter out dismissed notifications
      const active = res.data.filter(n => !dismissedIds.includes(n.id)).slice(0, 5)
      setNotifications(active)
    } catch (err) {
      console.error('Failed to fetch notifications:', err)
    } finally {
      setLoadingNotifs(false)
    }
  }

  useEffect(() => {
    fetchNotifications()
  }, [dismissedIds])

  const dismissNotification = (e, id) => {
    e.stopPropagation()
    const newDismissed = [...dismissedIds, id]
    setDismissedIds(newDismissed)
    localStorage.setItem('rms_dismissed_notifs', JSON.stringify(newDismissed))
  }

  const clearAllNotifications = () => {
    const allIds = notifications.map(n => n.id)
    const newDismissed = [...dismissedIds, ...allIds]
    setDismissedIds(newDismissed)
    localStorage.setItem('rms_dismissed_notifs', JSON.stringify(newDismissed))
  }

  return (
    <div className="rms-topbar">

      {/* Left: Hamburger (mobile only via CSS) + Search */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, flex: 1, minWidth: 0 }}>
        {/* Mobile hamburger — CSS hides this on desktop (≥992px) */}
        <button
          onClick={onMenuClick}
          className="rms-hamburger"
          aria-label="Open menu"
        >
          <i className="bi bi-list" style={{ fontSize: '1.4rem' }} />
        </button>

        {/* Global Search */}
        <div style={{ position: 'relative', flex: 1, maxWidth: 560 }}>
          <i className="bi bi-search" style={{
            position: 'absolute', left: 14, top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--rms-text-muted)', fontSize: '0.85rem', pointerEvents: 'none'
          }} />
          <input
            placeholder="Search candidates, resumes, roles…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={handleSearch}
            className="rms-topbar-search"
            onFocus={e => e.currentTarget.style.borderColor = 'var(--rms-primary)'}
            onBlur={e => e.currentTarget.style.borderColor = 'var(--rms-border)'}
          />
        </div>
      </div>

      {/* Right: Action Icons + Profile */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>

        {/* Notification Bell — desktop only */}
        <div className="rms-topbar-icons" style={{ position: 'relative' }}>
          <button
            title="Notifications"
            onClick={() => setNotifOpen(o => !o)}
            style={{
              width: 40, height: 40, borderRadius: 10,
              background: notifOpen ? 'rgba(99,102,241,0.18)' : 'rgba(99,102,241,0.10)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', border: '1px solid rgba(99,102,241,0.25)',
              color: 'var(--rms-primary)', position: 'relative', transition: 'all 0.2s'
            }}
          >
            <i className="bi bi-bell-fill" style={{ fontSize: '0.95rem' }} />
            {/* Badge - Show only if we have notifications */}
            {notifications.length > 0 && (
              <span style={{
                position: 'absolute', top: 7, right: 7,
                width: 8, height: 8, borderRadius: '50%',
                background: 'var(--rms-accent)',
                border: '2px solid var(--rms-bg)',
                animation: 'pulse 2s infinite'
              }} />
            )}
          </button>

          {/* Notification Dropdown */}
          {notifOpen && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 10px)', right: 0,
              width: 320, background: 'var(--rms-surface)',
              border: '1px solid var(--rms-border)', borderRadius: 14,
              boxShadow: '0 16px 48px rgba(0,0,0,0.5)',
              zIndex: 200, overflow: 'hidden'
            }}>
              <div style={{
                padding: '14px 18px', borderBottom: '1px solid var(--rms-border)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Notifications</span>
                  {notifications.length > 0 && (
                    <span style={{
                      fontSize: '0.65rem', fontWeight: 700, padding: '2px 8px', borderRadius: 6,
                      background: 'rgba(6,214,160,0.12)', color: 'var(--rms-accent)',
                      border: '1px solid rgba(6,214,160,0.2)'
                    }}>{notifications.length} NEW</span>
                  )}
                </div>
                {notifications.length > 0 && (
                  <button 
                    onClick={clearAllNotifications}
                    style={{ background: 'none', border: 'none', color: 'var(--rms-primary)', fontSize: '0.75rem', fontWeight: 600, padding: 0, cursor: 'pointer' }}
                  >
                    Clear All
                  </button>
                )}
              </div>

              <div style={{ maxHeight: 400, overflowY: 'auto' }}>
                {loadingNotifs ? (
                  <div style={{ padding: 20, textAlign: 'center' }}>
                    <div className="spinner-border spinner-border-sm text-primary" role="status" />
                  </div>
                ) : notifications.length === 0 ? (
                  <div style={{ padding: 30, textAlign: 'center', color: 'var(--rms-text-dim)', fontSize: '0.85rem' }}>
                    <i className="bi bi-bell-slash d-block mb-2" style={{ fontSize: '1.5rem', opacity: 0.3 }} />
                    No new notifications
                  </div>
                ) : (
                  notifications.map((n, i) => (
                    <div key={n.id} 
                      className="rms-notif-item"
                      style={{
                        display: 'flex', alignItems: 'flex-start', gap: 12,
                        padding: '12px 18px',
                        borderBottom: i < notifications.length - 1 ? '1px solid var(--rms-border)' : 'none',
                        cursor: 'pointer', transition: 'background 0.15s',
                        position: 'relative'
                      }}
                      onClick={() => {
                        navigate('/dashboard')
                        setNotifOpen(false)
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--rms-surface-2)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <div style={{
                        width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                        background: n.resumeStatus === 'SELECTED' ? 'rgba(16,185,129,0.15)' : 'rgba(99,102,241,0.15)', 
                        color: n.resumeStatus === 'SELECTED' ? '#10b981' : 'var(--rms-primary)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem'
                      }}>
                        <i className={`bi ${n.resumeStatus === 'SELECTED' ? 'bi-award-fill' : 'bi-file-earmark-person-fill'}`} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0, paddingRight: 20 }}>
                        <div style={{ fontSize: '0.8rem', color: 'var(--rms-text)', lineHeight: 1.4 }}>
                          <strong>{n.candidateName || n.fileName?.split('.')[0]}</strong> has been updated to <strong>{n.resumeStatus?.replace(/_/g, ' ')}</strong>
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--rms-text-dim)', marginTop: 2 }}>{timeAgo(n.uploadedAt)}</div>
                      </div>
                      
                      {/* Individual Clear Button */}
                      <button 
                        className="rms-notif-remove"
                        onClick={(e) => dismissNotification(e, n.id)}
                        style={{
                          position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                          width: 24, height: 24, borderRadius: '50%', background: 'var(--rms-surface-2)',
                          border: '1px solid var(--rms-border)', color: 'var(--rms-text-muted)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem',
                          cursor: 'pointer'
                        }}
                      >
                        <i className="bi bi-x" />
                      </button>
                    </div>
                  ))
                )}
              </div>

              <div style={{ padding: '10px 18px', textAlign: 'center', borderTop: '1px solid var(--rms-border)' }}>
                <span 
                  onClick={() => { navigate('/candidates'); setNotifOpen(false); }}
                  style={{ fontSize: '0.78rem', color: 'var(--rms-primary)', fontWeight: 600, cursor: 'pointer' }}
                >
                  View all candidates
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="rms-topbar-icons" style={{ width: 1, height: 28, background: 'var(--rms-border)' }} />

        {/* Profile */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="rms-topbar-profile-info">
            <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--rms-text)', whiteSpace: 'nowrap' }}>
              {user?.name || 'Administrator'}
            </div>
            <div style={{ fontSize: '0.65rem', fontWeight: 600, color: 'var(--rms-primary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {user?.role || 'ADMIN'}
            </div>
          </div>
          <div style={{
            width: 40, height: 40, borderRadius: 10,
            background: 'var(--rms-surface-2)',
            border: '2px solid var(--rms-primary)',
            overflow: 'hidden', flexShrink: 0,
            boxShadow: '0 0 0 3px rgba(99,102,241,0.15)'
          }}>
            <img
              src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'Admin')}&background=7239ea&color=fff&bold=true`}
              alt="Profile"
              style={{ width: '100%', height: '100%' }}
            />
          </div>
        </div>
      </div>

    </div>
  )
}
