import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import RoleBadge from './RoleBadge'
import { toast } from 'react-toastify'

const NAV_LINKS = [
  { to: '/dashboard',   icon: 'bi-grid-1x2-fill',       label: 'Dashboard' },
  { to: '/candidates',  icon: 'bi-people-fill',          label: 'Candidates' },
  { to: '/pipeline',    icon: 'bi-diagram-3-fill',       label: 'Pipeline',
    style: { color: '#7c3aed', borderLeftColor: '#7c3aed' } },
  { to: '/upload',      icon: 'bi-cloud-upload-fill',    label: 'Upload Resumes' },
  { to: '/search',      icon: 'bi-search',               label: 'Search' },
  { to: '/bulk-delete', icon: 'bi-trash3-fill',          label: 'Manage / Delete',
    style: { color: 'var(--rms-danger)', borderLeftColor: 'var(--rms-danger)' } },
  { to: '/settings',    icon: 'bi-gear-fill',            label: 'Settings' }
]

export default function Sidebar({ isOpen, onClose }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleNavClick = (e) => {
    if (window.isUploading) {
      e.preventDefault()
      toast.warning('Upload in progress! Please do not switch pages until it is completed.')
      return
    }
    onClose()
  }

  const handleLogout = () => {
    if (window.isUploading) {
      toast.warning('Upload in progress! Please wait until it completes before signing out.')
      return
    }
    logout()
    navigate('/login')
  }

  return (
    <nav className={`rms-sidebar ${isOpen ? 'open' : ''}`} aria-label="Main navigation">
      {/* Logo Section */}
      <div className="rms-sidebar-logo">
        <div style={{ 
          width: 36, height: 36, borderRadius: 10, 
          background: 'linear-gradient(135deg, var(--rms-primary), var(--rms-secondary))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(99, 102, 241, 0.4)'
        }}>
          <i className="bi bi-shield-check-fill" style={{ color: '#fff', fontSize: '1.25rem' }} />
        </div>
        <span style={{ letterSpacing: '-0.02em', fontWeight: 800 }}>CADDAM <span style={{ color: 'var(--rms-primary)' }}>HR</span></span>
      </div>

      {/* Navigation */}
      <div style={{ flex: 1, padding: '12px 0', overflowY: 'auto' }}>
        <div style={{ padding: '0 24px 8px', fontSize: '0.65rem', fontWeight: 700, color: 'var(--rms-text-dim)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          Menu
        </div>
        {NAV_LINKS.map(link => (
          <NavLink key={link.to} to={link.to}
            id={`nav-${link.label.toLowerCase().replace(/\s+/g, '-')}`}
            onClick={handleNavClick}
            className={({ isActive }) => `rms-nav-item ${isActive ? 'active' : ''}`}
          >
            <i className={`bi ${link.icon}`} />
            {link.label}
          </NavLink>
        ))}
        
        {user?.role === 'ADMIN' && (
          <>
            <div style={{ padding: '24px 24px 8px', fontSize: '0.65rem', fontWeight: 700, color: 'var(--rms-text-dim)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Administration
            </div>
            <NavLink to="/create-hr"
              id="nav-create-hr"
              onClick={handleNavClick}
              className={({ isActive }) => `rms-nav-item ${isActive ? 'active' : ''}`}
            >
              <i className="bi bi-person-plus-fill" />
              Create HR
            </NavLink>
          </>
        )}
      </div>

      {/* User Profile Section */}
      <div style={{ padding: '20px', marginTop: 'auto', borderTop: '1px solid var(--rms-border)', background: 'rgba(255,255,255,0.01)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <div style={{ 
            width: 42, height: 42, borderRadius: 12, background: 'var(--rms-surface-2)', 
            border: '1px solid var(--rms-border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', 
            fontWeight: 800, color: 'var(--rms-primary)', fontSize: '1.1rem'
          }}>
            {user?.name?.[0]}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.name}
            </div>
            <div style={{ marginTop: 2 }}>
              <RoleBadge role={user?.role} />
            </div>
          </div>
        </div>
        
        <button id="sidebar-logout" onClick={handleLogout} className="btn-rms-outline"
          style={{ width: '100%', padding: '10px', fontSize: '0.85rem', justifyContent: 'center', borderRadius: 10 }}>
          <i className="bi bi-box-arrow-left" /> Sign Out
        </button>
      </div>
    </nav>
  )
}
