import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'
import { toast } from 'react-toastify'
import ResumeCard from '../components/ResumeCard'
import RoleBadge from '../components/RoleBadge'
import { formatDate } from '../utils/formatDate'
import PasswordModal from '../components/PasswordModal'

export default function CandidateDetail() {
  const { id } = useParams()
  const { hasRole } = useAuth()
  const navigate = useNavigate()
  const [candidate, setCandidate] = useState(null)
  const [loading, setLoading] = useState(true)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [isEditingNotes, setIsEditingNotes] = useState(false)
  const [notes, setNotes] = useState('')

  // Password Modal state
  const [pwdModalConfig, setPwdModalConfig] = useState({ isOpen: false, action: null, targetId: null, type: null })

  useEffect(() => {
    api.get(`/api/candidates/${id}`)
      .then(r => {
        setCandidate(r.data)
        setNotes(r.data.summary || '')
      })
      .catch(() => toast.error('Failed to load candidate'))
      .finally(() => setLoading(false))
  }, [id])

  const handleDeleteClick = () => {
    setPwdModalConfig({ isOpen: true, action: 'DEACTIVATE_CANDIDATE', targetId: id, type: 'candidate' })
  }

  const handleDeleteResumeClick = (resumeId) => {
    setPwdModalConfig({ isOpen: true, action: 'DELETE_RESUME', targetId: resumeId, type: 'resume' })
  }

  const handlePasswordSubmit = async (pwd) => {
    try {
      if (pwdModalConfig.action === 'DEACTIVATE_CANDIDATE') {
        await api.delete(`/api/candidates/${pwdModalConfig.targetId}?password=${encodeURIComponent(pwd)}`)
        toast.success('Candidate deactivated')
        navigate('/candidates')
      } else if (pwdModalConfig.action === 'DELETE_RESUME') {
        await api.delete(`/api/resumes/${pwdModalConfig.targetId}?password=${encodeURIComponent(pwd)}`)
        toast.success('Resume deleted')
        setCandidate(prev => ({
          ...prev,
          resumes: prev.resumes.filter(r => r.id !== pwdModalConfig.targetId)
        }))
      }
      setPwdModalConfig({ isOpen: false, action: null, targetId: null, type: null })
    } catch (err) {
      toast.error(err.response?.data?.error || `Failed to delete ${pwdModalConfig.type}`)
      throw err // Let modal know it failed
    }
  }

  const handleStatusChange = async (resumeId, newStatus) => {
    try {
      await api.patch(`/api/resumes/${resumeId}/status?resumeStatus=${newStatus}`)
      setCandidate(prev => ({
        ...prev,
        resumes: prev.resumes.map(r => r.id === resumeId ? { ...r, resumeStatus: newStatus } : r)
      }))
      toast.success('Status updated')
    } catch { toast.error('Failed to update status') }
  }

  const handleRecruitmentStatusChange = async (newStatus) => {
    setUpdatingStatus(true)
    try {
      await api.patch(`/api/candidates/${id}/recruitment-status?status=${newStatus}`)
      setCandidate(prev => ({ ...prev, recruitmentStatus: newStatus }))
      toast.success(`Candidate status updated to ${newStatus.replace(/_/g, ' ')}`)
    } catch { toast.error('Failed to update recruitment status') }
    finally { setUpdatingStatus(false) }
  }

  const handleUpdateNotes = async () => {
    setUpdatingStatus(true)
    try {
      await api.put(`/api/candidates/${id}`, { ...candidate, summary: notes })
      setCandidate(prev => ({ ...prev, summary: notes }))
      setIsEditingNotes(false)
      toast.success('Notes updated')
    } catch { toast.error('Failed to update notes') }
    finally { setUpdatingStatus(false) }
  }

  const toggleStatus = async () => {
    const newStatus = candidate.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'
    setUpdatingStatus(true)
    try {
      await api.put(`/api/candidates/${id}`, { ...candidate, status: newStatus })
      setCandidate(prev => ({ ...prev, status: newStatus }))
      toast.success(`Candidate marked as ${newStatus}`)
    } catch { toast.error('Failed to update status') }
    finally { setUpdatingStatus(false) }
  }

  if (loading) return (
    <>
      <div className="rms-spinner"><div className="spinner-border text-primary" /></div>
    </>
  )

  if (!candidate) return (
    <>
      <div className="rms-empty"><i className="bi bi-person-x" /><p>Candidate not found</p></div>
    </>
  )

  return (
    <div className="fade-in">
      <PasswordModal
        isOpen={pwdModalConfig.isOpen}
        onClose={() => setPwdModalConfig({ isOpen: false, action: null, targetId: null, type: null })}
        onSubmit={handlePasswordSubmit}
        title={`Delete ${pwdModalConfig.type === 'candidate' ? 'Candidate' : 'Resume'}`}
        message={`Are you sure you want to delete this ${pwdModalConfig.type}? This action cannot be undone. Please enter your password to confirm.`}
        confirmText="Yes, Delete it"
      />

      {/* Back */}
      <Link to="/candidates" style={{ color: 'var(--rms-text-muted)', fontSize: '0.88rem', textDecoration: 'none', marginBottom: 24, display: 'inline-block' }}>
        <i className="bi bi-arrow-left me-1" /> Back to Candidates
      </Link>

      {/* Profile Header */}
      <div className="rms-card mb-4" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
        <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
          <div style={{
            width: 72, height: 72, borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--rms-primary), var(--rms-secondary))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.8rem', color: '#fff', fontWeight: 700, flexShrink: 0
          }}>
            {candidate.name?.[0]?.toUpperCase()}
          </div>
          <div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: 4 }}>{candidate.name}</h1>
            <p style={{ color: 'var(--rms-text-muted)', fontSize: '0.9rem', margin: 0 }}>{candidate.jobRole || 'No role specified'}</p>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 8 }}>
              <span className={`rms-badge badge-${candidate.status?.toLowerCase()}`}>{candidate.status}</span>
              <button
                onClick={toggleStatus}
                disabled={updatingStatus}
                style={{
                  background: 'none', border: 'none', color: 'var(--rms-primary)',
                  fontSize: '0.75rem', fontWeight: 600, padding: 0, cursor: 'pointer',
                  textDecoration: 'underline'
                }}
              >
                Mark as {candidate.status === 'ACTIVE' ? 'Inactive' : 'Active'}
              </button>
            </div>
          </div>
        </div>

        {hasRole('ADMIN') && (
          <button className="btn-rms-danger" onClick={handleDeleteClick} id="delete-candidate-btn">
            <i className="bi bi-trash" /> Deactivate
          </button>
        )}
      </div>

      {/* HR Recruitment Status */}
      {(hasRole('ADMIN') || hasRole('RECRUITER') || hasRole('HR')) && (
        <div className="rms-card mb-4">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h2 style={{ fontSize: '0.9rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--rms-text-muted)', margin: 0, marginBottom: 4 }}>
                HR Recruitment Status
              </h2>
              <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--rms-text-muted)' }}>Update the candidate's current stage in the hiring pipeline</p>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {[
                { value: 'APPLIED', label: 'Applied', color: '#4f8ef7' },
                { value: 'UNDER_REVIEW', label: 'Under Review', color: '#f59e0b' },
                { value: 'SHORTLISTED', label: 'Shortlisted', color: '#06d6a0' },
                { value: 'INTERVIEW_SCHEDULED', label: 'Interview Scheduled', color: '#7c3aed' },
                { value: 'SELECTED', label: 'Selected', color: '#10b981' },
                { value: 'REJECTED', label: 'Rejected', color: '#ef4444' },
                { value: 'ON_HOLD', label: 'On Hold', color: '#6b7280' },
              ].map(s => {
                const active = candidate.recruitmentStatus === s.value
                return (
                  <button key={s.value}
                    id={`status-${s.value.toLowerCase()}`}
                    onClick={() => handleRecruitmentStatusChange(s.value)}
                    disabled={updatingStatus || active}
                    style={{
                      padding: '6px 14px', borderRadius: 999, fontSize: '0.78rem',
                      fontWeight: 700, cursor: active ? 'default' : 'pointer',
                      border: `2px solid ${s.color}`,
                      background: active ? s.color : 'transparent',
                      color: active ? '#fff' : s.color,
                      transition: 'all 0.15s',
                      opacity: updatingStatus && !active ? 0.5 : 1
                    }}>
                    {active && updatingStatus ? '...' : s.label}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}

      <div className="row g-3">
        {/* Info */}
        <div className="col-md-5">
          {candidate.skills?.length > 0 && (
            <div className="rms-card mb-3">
              <h2 style={{ fontSize: '0.9rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--rms-text-muted)', marginBottom: 12 }}>
                Skills
              </h2>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {candidate.skills.map(s => <span key={s} className="skill-tag">{s}</span>)}
              </div>
            </div>
          )}

          {/* Notes / Summary Section */}
          <div className="rms-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ fontSize: '0.9rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--rms-text-muted)', margin: 0 }}>
                Candidate Notes
              </h2>
              {!isEditingNotes && (
                <button
                  onClick={() => setIsEditingNotes(true)}
                  className="btn-rms-outline"
                  style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                >
                  <i className="bi bi-pencil" /> Edit
                </button>
              )}
            </div>

            {isEditingNotes ? (
              <div>
                <textarea
                  className="rms-input w-100"
                  rows={4}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add a short summary or notes about this candidate..."
                  style={{ fontSize: '0.9rem', marginBottom: 12, resize: 'vertical' }}
                />
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                  <button
                    onClick={() => { setIsEditingNotes(false); setNotes(candidate.summary || '') }}
                    className="btn-rms-outline"
                    style={{ fontSize: '0.8rem' }}
                    disabled={updatingStatus}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdateNotes}
                    className="btn-rms"
                    style={{ fontSize: '0.8rem' }}
                    disabled={updatingStatus}
                  >
                    {updatingStatus ? 'Saving...' : 'Save Notes'}
                  </button>
                </div>
              </div>
            ) : (
              <div style={{
                fontSize: '0.92rem', color: candidate.summary ? 'var(--rms-text)' : 'var(--rms-text-muted)',
                lineHeight: 1.5, fontStyle: candidate.summary ? 'normal' : 'italic',
                whiteSpace: 'pre-wrap', wordBreak: 'break-word', overflowWrap: 'break-word',
                maxHeight: '300px', overflowY: 'auto', paddingRight: '8px'
              }}>
                {candidate.summary || 'No notes added yet.'}
              </div>
            )}
          </div>
        </div>

        {/* Resumes */}
        <div className="col-md-7">
          <div className="rms-card h-100">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: '0.9rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--rms-text-muted)', margin: 0 }}>
                Resumes ({candidate.resumes?.length || 0})
              </h2>
              <Link to="/upload" className="btn-rms" style={{ fontSize: '0.82rem', padding: '8px 16px' }}>
                <i className="bi bi-upload" /> Upload
              </Link>
            </div>

            {(!candidate.resumes || candidate.resumes.length === 0) ? (
              <div className="rms-empty" style={{ padding: '40px 20px' }}>
                <i className="bi bi-file-earmark-x" />
                <p>No resumes uploaded yet</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {candidate.resumes.map(r => (
                  <ResumeCard key={r.id} resume={r}
                    onDelete={handleDeleteResumeClick}
                    onStatusChange={handleStatusChange} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
