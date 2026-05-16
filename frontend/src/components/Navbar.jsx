import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'

export default function Navbar({ onMenuClick }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [notifOpen, setNotifOpen] = useState(false)

  const handleSearch = (e) => {
    if (e.key === 'Enter' && search.trim()) {
      navigate(`/search?keyword=${encodeURIComponent(search.trim())}`)
    }
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
          {search && (
            <button
              onClick={() => setSearch('')}
              style={{
                position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', color: 'var(--rms-text-dim)', cursor: 'pointer', padding: 2
              }}
            >
              <i className="bi bi-x" style={{ fontSize: '1rem' }} />
            </button>
          )}
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
            {/* Badge */}
            <span style={{
              position: 'absolute', top: 7, right: 7,
              width: 8, height: 8, borderRadius: '50%',
              background: 'var(--rms-accent)',
              border: '2px solid var(--rms-bg)',
              animation: 'pulse 2s infinite'
            }} />
          </button>

          {/* Notification Dropdown */}
          {notifOpen && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 10px)', right: 0,
              width: 300, background: 'var(--rms-surface)',
              border: '1px solid var(--rms-border)', borderRadius: 14,
              boxShadow: '0 16px 48px rgba(0,0,0,0.5)',
              zIndex: 200, overflow: 'hidden'
            }}>
              <div style={{
                padding: '14px 18px', borderBottom: '1px solid var(--rms-border)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
              }}>
                <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Notifications</span>
                <span style={{
                  fontSize: '0.65rem', fontWeight: 700, padding: '2px 8px', borderRadius: 6,
                  background: 'rgba(6,214,160,0.12)', color: 'var(--rms-accent)',
                  border: '1px solid rgba(6,214,160,0.2)'
                }}>3 NEW</span>
              </div>
              {[
                { icon: 'bi-person-plus-fill', color: '#6366f1', msg: 'New candidate applied for React Dev', time: '2m ago' },
                { icon: 'bi-file-earmark-pdf-fill', color: '#a855f7', msg: 'Resume processed successfully', time: '15m ago' },
                { icon: 'bi-check2-circle', color: '#10b981', msg: 'Candidate shortlisted by HR team', time: '1h ago' },
              ].map((n, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'flex-start', gap: 12,
                  padding: '12px 18px',
                  borderBottom: i < 2 ? '1px solid var(--rms-border)' : 'none',
                  cursor: 'pointer', transition: 'background 0.15s'
                }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--rms-surface-2)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{
                    width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                    background: `${n.color}18`, color: n.color,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem'
                  }}>
                    <i className={`bi ${n.icon}`} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--rms-text)', lineHeight: 1.4 }}>{n.msg}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--rms-text-dim)', marginTop: 2 }}>{n.time}</div>
                  </div>
                </div>
              ))}
              <div style={{ padding: '10px 18px', textAlign: 'center' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--rms-primary)', fontWeight: 600, cursor: 'pointer' }}>
                  View all notifications
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
