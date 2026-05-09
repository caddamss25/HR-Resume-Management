import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'

export default function Navbar({ title }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')

  const handleSearch = (e) => {
    if (e.key === 'Enter' && search.trim()) {
      navigate(`/search?keyword=${encodeURIComponent(search.trim())}`)
    }
  }

  return (
    <div className="rms-topbar" style={{ background: 'var(--rms-bg)', borderBottom: 'none', padding: '10px 0', marginBottom: '32px' }}>
      
      {/* Left: Global Search */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 24, flex: 1 }}>
        <div style={{ position: 'relative', width: '100%', maxWidth: 400 }}>
          <i className="bi bi-search" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--rms-text-muted)', fontSize: '0.85rem' }} />
          <input 
            placeholder="Global search..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={handleSearch}
            style={{ 
              background: 'var(--rms-surface)', border: '1px solid var(--rms-border)', borderRadius: 8,
              padding: '10px 16px 10px 40px', color: 'var(--rms-text)', width: 280, fontSize: '0.85rem', outline: 'none',
              transition: 'all 0.2s'
            }} 
            onFocus={e => e.currentTarget.style.borderColor = 'var(--rms-primary)'}
            onBlur={e => e.currentTarget.style.borderColor = 'var(--rms-border)'}
          />
        </div>
      </div>

      {/* Right: Actions & Profile */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }} className="rms-desktop-only">
          {['bi-bell-fill', 'bi-ui-checks-grid', 'bi-folder-fill', 'bi-chat-left-dots-fill'].map((icon, i) => (
            <div key={i} style={{ 
              width: 36, height: 36, borderRadius: 8, background: 'var(--rms-surface)', 
              display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
              color: i === 0 ? 'var(--rms-primary)' : 'var(--rms-text-muted)',
              border: '1px solid var(--rms-border)'
            }}>
              <i className={`bi ${icon}`} style={{ fontSize: '0.9rem' }} />
            </div>
          ))}
        </div>
        
        {/* Profile */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingLeft: 16, borderLeft: '1px solid var(--rms-border)' }}>
          <div style={{ textAlign: 'right' }} className="rms-desktop-only">
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--rms-text)' }}>{user?.name || 'Administrator'}</div>
            <div style={{ fontSize: '0.65rem', fontWeight: 600, color: 'var(--rms-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{user?.role || 'ADMIN'}</div>
          </div>
          <div style={{ width: 42, height: 42, borderRadius: 10, background: 'var(--rms-surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid var(--rms-border)', overflow: 'hidden' }}>
            <img src={`https://ui-avatars.com/api/?name=${user?.name || 'Admin'}&background=7239ea&color=fff&bold=true`} alt="Profile" style={{ width: '100%', height: '100%' }} />
          </div>
        </div>
      </div>
      
    </div>
  )
}
