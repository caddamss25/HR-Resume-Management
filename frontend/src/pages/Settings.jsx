import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { toast } from 'react-toastify'
import '../index.css'

export default function Settings() {
    const { user, changePassword } = useAuth()
    const [formData, setFormData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    })
    const [loading, setLoading] = useState(false)

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (formData.newPassword !== formData.confirmPassword) {
            toast.error('New passwords do not match')
            return
        }

        if (formData.newPassword.length < 6) {
            toast.error('New password must be at least 6 characters')
            return
        }

        setLoading(true)
        try {
            await changePassword(formData.currentPassword, formData.newPassword)
            toast.success('Password updated successfully!')
            setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' })
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to update password')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="rms-container fade-in">
            <div style={{ marginBottom: '2rem' }}>
                <h1 className="rms-page-title">Account Settings</h1>
                <p className="rms-page-subtitle">Manage your security and account preferences</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
                {/* Change Password Card */}
                <div className="rms-card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.5rem', borderBottom: '1px solid var(--rms-border)', paddingBottom: '1rem' }}>
                        <i className="bi bi-shield-lock-fill" style={{ fontSize: '1.4rem', color: 'var(--rms-primary)' }}></i>
                        <h2 style={{ fontSize: '1.2rem', fontWeight: 600 }}>Change Password</h2>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="rms-form-group">
                            <label className="rms-label">Current Password</label>
                            <input
                                type="password"
                                name="currentPassword"
                                className="rms-input"
                                value={formData.currentPassword}
                                onChange={handleChange}
                                required
                                placeholder="Enter current password"
                            />
                        </div>

                        <div className="rms-form-group">
                            <label className="rms-label">New Password</label>
                            <input
                                type="password"
                                name="newPassword"
                                className="rms-input"
                                value={formData.newPassword}
                                onChange={handleChange}
                                required
                                placeholder="Enter new password"
                            />
                        </div>

                        <div className="rms-form-group">
                            <label className="rms-label">Confirm New Password</label>
                            <input
                                type="password"
                                name="confirmPassword"
                                className="rms-input"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                required
                                placeholder="Confirm new password"
                            />
                        </div>

                        <div style={{ marginTop: '2rem' }}>
                            <button 
                                type="submit" 
                                className="btn-rms" 
                                disabled={loading}
                                style={{ width: '100%' }}
                            >
                                {loading ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                                        Updating...
                                    </>
                                ) : (
                                    <>
                                        <i className="bi bi-key-fill"></i>
                                        Update Password
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Account Info Card */}
                <div className="rms-card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.5rem', borderBottom: '1px solid var(--rms-border)', paddingBottom: '1rem' }}>
                        <i className="bi bi-person-badge-fill" style={{ fontSize: '1.4rem', color: 'var(--rms-primary)' }}></i>
                        <h2 style={{ fontSize: '1.2rem', fontWeight: 600 }}>Profile Overview</h2>
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div>
                            <label className="rms-label">Full Name</label>
                            <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--rms-text)' }}>{user?.name}</div>
                        </div>
                        <div>
                            <label className="rms-label">Email Address</label>
                            <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--rms-text)' }}>{user?.email}</div>
                        </div>
                        <div>
                            <label className="rms-label">Account Role</label>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 16px', borderRadius: '20px', background: 'rgba(114, 57, 234, 0.1)', color: 'var(--rms-primary)', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase' }}>
                                <i className="bi bi-patch-check-fill"></i>
                                {user?.role}
                            </div>
                        </div>
                    </div>

                    <div style={{ marginTop: '2.5rem', padding: '20px', background: 'var(--rms-surface-2)', borderRadius: 'var(--rms-radius-sm)', border: '1px dashed var(--rms-border)' }}>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <i className="bi bi-info-circle-fill" style={{ color: 'var(--rms-primary)', fontSize: '1.2rem' }}></i>
                            <div>
                                <h4 style={{ fontSize: '0.9rem', marginBottom: '4px', fontWeight: 600 }}>Security Tip</h4>
                                <p style={{ fontSize: '0.85rem', color: 'var(--rms-text-muted)', lineHeight: 1.5 }}>
                                    Use a strong password with a mix of letters, numbers, and symbols to keep your account secure.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
