import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { toast } from 'react-toastify'
import api from '../api/axios'

const ROLES = [
  { value: 'HR_RECRUITER', label: 'HR Recruiter' },
  { value: 'ADMIN', label: 'Admin' }
]

export default function Register() {
  const { register, user } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'HR_RECRUITER' })
  const [loading, setLoading] = useState(false)
  const [hrList, setHrList] = useState([])

  const fetchHRList = async () => {
    try {
      const { data } = await api.get('/api/auth/users')
      setHrList(data)
    } catch (err) {
      console.error('Failed to load HR recruiters:', err)
    }
  }

  useEffect(() => {
    if (user?.role !== 'ADMIN') {
      toast.error('Only administrators can create new accounts')
      navigate('/dashboard')
    } else {
      fetchHRList()
    }
  }, [user, navigate])

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.password.length < 6) { toast.error('Password must be at least 6 characters'); return }
    setLoading(true)
    try {
      await register(form.name, form.email, form.password, form.role)
      toast.success('Account created successfully!')
      setForm({ name: '', email: '', password: '', role: 'HR_RECRUITER' })
      fetchHRList()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteHR = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete/relieve HR recruiter "${name}"? This action cannot be undone.`)) return
    try {
      await api.delete(`/api/auth/users/${id}`)
      toast.success(`HR recruiter "${name}" has been relieved successfully!`)
      fetchHRList()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete HR account')
    }
  }

  if (user?.role !== 'ADMIN') return null

  return (
    <div className="fade-in">
      <h2 className="rms-page-title"><i className="bi bi-person-gear" /> Manage HR Accounts</h2>
      <p className="rms-page-subtitle">Register new HR recruiters or relieve existing accounts from the system.</p>

      <div className="row g-4" style={{ marginTop: 8 }}>
        {/* Left: Create Account Form */}
        <div className="col-lg-5">
          <div className="rms-card h-100">
            <h3 style={{ fontSize: '1.15rem', marginBottom: 20, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
              <i className="bi bi-person-plus-fill text-primary" /> Create Account
            </h3>
            <form onSubmit={handleSubmit} id="register-form">
              <div className="rms-form-group">
                <label className="rms-label" htmlFor="reg-name">Full Name</label>
                <input id="reg-name" name="name" type="text" className="rms-input"
                  placeholder="John Smith" value={form.name} onChange={handleChange} required />
              </div>

              <div className="rms-form-group">
                <label className="rms-label" htmlFor="reg-email">Email</label>
                <input id="reg-email" name="email" type="email" className="rms-input"
                  placeholder="you@company.com" value={form.email} onChange={handleChange} required />
              </div>

              <div className="rms-form-group">
                <label className="rms-label" htmlFor="reg-password">Password</label>
                <input id="reg-password" name="password" type="password" className="rms-input"
                  placeholder="Min 6 characters" value={form.password} onChange={handleChange} required />
              </div>

              <div className="rms-form-group">
                <label className="rms-label">Role</label>
                <div style={{ display: 'flex', gap: 12 }}>
                  {ROLES.map(r => (
                    <label key={r.value} style={{
                      flex: 1, cursor: 'pointer', border: `2px solid ${form.role === r.value ? 'var(--rms-primary)' : 'var(--rms-border)'}`,
                      borderRadius: 8, padding: '12px', textAlign: 'center',
                      background: form.role === r.value ? 'rgba(79,142,247,0.1)' : 'var(--rms-surface-2)',
                      transition: 'all 0.15s', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4
                    }}>
                      <input type="radio" name="role" value={r.value} id={`role-${r.value}`}
                        checked={form.role === r.value} onChange={handleChange}
                        style={{ display: 'none' }} />
                      <span style={{ fontSize: '1.2rem' }}>{r.label.split(' ')[0]}</span>
                      <span style={{ fontSize: '0.82rem', fontWeight: 600, color: form.role === r.value ? 'var(--rms-primary)' : 'var(--rms-text-muted)' }}>
                        {r.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <button type="submit" id="reg-submit" className="btn-rms w-100"
                disabled={loading} style={{ width: '100%', justifyContent: 'center', padding: '14px', marginTop: 12 }}>
                {loading
                  ? <><span className="spinner-border spinner-border-sm me-2" />Creating account...</>
                  : <><i className="bi bi-person-plus-fill" /> Create Account</>}
              </button>
            </form>
          </div>
        </div>

        {/* Right: Active Directories / Deletion */}
        <div className="col-lg-7">
          <div className="rms-card h-100">
            <h3 style={{ fontSize: '1.15rem', marginBottom: 20, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
              <i className="bi bi-people-fill text-primary" /> Active HR & Admin Accounts ({hrList.length})
            </h3>
            <div style={{ maxHeight: '460px', overflowY: 'auto', paddingRight: '4px' }}>
              {hrList.length === 0 ? (
                <div className="rms-empty" style={{ padding: '40px 0' }}>
                  <i className="bi bi-person-x" />
                  <p>No active HR accounts found</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {hrList.map(hr => (
                    <div key={hr.id} style={{
                      background: 'var(--rms-surface-2)',
                      border: '1px solid var(--rms-border)',
                      borderRadius: 10,
                      padding: '12px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 12,
                      transition: 'border-color 0.2s'
                    }}
                      onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--rms-border-hover)'}
                      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--rms-border)'}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                        <div style={{
                          width: 38, height: 38, borderRadius: '50%',
                          background: hr.role === 'ADMIN' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(79, 142, 247, 0.1)',
                          color: hr.role === 'ADMIN' ? 'var(--rms-danger)' : 'var(--rms-primary)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontWeight: 700, flexShrink: 0, fontSize: '0.95rem'
                        }}>
                          {hr.name?.[0]?.toUpperCase()}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {hr.name}
                          </div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--rms-text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {hr.email}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span style={{
                          fontSize: '0.7rem', fontWeight: 700, padding: '2px 8px', borderRadius: 999,
                          background: hr.role === 'ADMIN' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(79, 142, 247, 0.15)',
                          color: hr.role === 'ADMIN' ? '#ef4444' : '#4f8ef7',
                          textTransform: 'uppercase'
                        }}>
                          {hr.role === 'ADMIN' ? 'Admin' : 'HR Recruiter'}
                        </span>
                        
                        {/* Prevent deleting the currently logged-in administrator */}
                        {hr.id !== user?.id && (
                          <button
                            onClick={() => handleDeleteHR(hr.id, hr.name)}
                            className="btn-rms-outline"
                            style={{
                              padding: '6px 10px', color: 'var(--rms-danger)', borderColor: 'rgba(239, 68, 68, 0.2)',
                              background: 'transparent', borderRadius: 8, fontSize: '0.85rem'
                            }}
                            onMouseEnter={e => {
                              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'
                              e.currentTarget.style.borderColor = 'var(--rms-danger)'
                            }}
                            onMouseLeave={e => {
                              e.currentTarget.style.background = 'transparent'
                              e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.2)'
                            }}
                            title="Relieve/Delete HR"
                          >
                            <i className="bi bi-trash" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
