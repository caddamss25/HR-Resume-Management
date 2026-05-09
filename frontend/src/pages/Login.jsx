import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { toast } from 'react-toastify'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await login(form.email, form.password)
      toast.success('Welcome back!')
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login failed. Please check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rms-auth-bg">
      <div className="rms-auth-card fade-in">
        <div className="text-center mb-5">
          <div className="rms-auth-logo">
            <div style={{ 
              width: 48, height: 48, borderRadius: 14, 
              background: 'linear-gradient(135deg, var(--rms-primary), var(--rms-secondary))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 8px 24px rgba(99, 102, 241, 0.4)'
            }}>
              <i className="bi bi-shield-lock-fill" style={{ color: '#fff', fontSize: '1.5rem' }} />
            </div>
            <span style={{ letterSpacing: '0.05em', fontWeight: 900 }}>CADDAM <span style={{ color: 'var(--rms-primary)' }}>HR</span></span>
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff', marginBottom: 8, fontFamily: 'Outfit, sans-serif' }}>
            Enterprise Access
          </h1>
          <p style={{ color: 'var(--rms-text-muted)', fontSize: '0.9375rem', fontWeight: 500 }}>
            Sign in to manage your hiring pipeline
          </p>
        </div>

        <form onSubmit={handleSubmit} id="login-form">
          <div className="rms-form-group">
            <label className="rms-label" htmlFor="login-email">Corporate Email</label>
            <input
              id="login-email"
              name="email"
              type="email"
              className="rms-input"
              placeholder="admin@caddam.com"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="rms-form-group" style={{ marginBottom: 32 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <label className="rms-label" htmlFor="login-password" style={{ marginBottom: 0 }}>Password</label>
              <a href="#" style={{ fontSize: '0.75rem', color: 'var(--rms-primary)', textDecoration: 'none', fontWeight: 700 }}>Recovery?</a>
            </div>
            <input
              id="login-password"
              name="password"
              type="password"
              className="rms-input"
              placeholder="••••••••"
              value={form.password}
              onChange={handleChange}
              required
            />
          </div>

          <button
            type="submit"
            className="btn-rms w-100"
            disabled={loading}
            id="login-submit"
            style={{ width: '100%', padding: '16px', fontSize: '1rem', justifyContent: 'center' }}
          >
            {loading
              ? <><span className="spinner-border spinner-border-sm me-2" /> Authenticating...</>
              : <><i className="bi bi-box-arrow-in-right me-2" /> Enter Portal</>}
          </button>
        </form>

        <div style={{ marginTop: 40, textAlign: 'center' }}>
          <div style={{ width: 40, height: 1, background: 'var(--rms-border)', margin: '0 auto 20px' }} />
          <p style={{ fontSize: '0.7rem', color: 'var(--rms-text-dim)', textTransform: 'uppercase', letterSpacing: '0.2em', fontWeight: 800 }}>
            <i className="bi bi-incognito me-2" /> Secure Infrastructure
          </p>
        </div>
      </div>
    </div>
  )
}
