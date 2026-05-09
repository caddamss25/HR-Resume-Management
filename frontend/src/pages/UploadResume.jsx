import { useState, useEffect } from 'react'
import api from '../api/axios'
import { toast } from 'react-toastify'
import { useDropzone } from 'react-dropzone'
import ResumeViewButton from '../components/ResumeViewButton'

const RESUME_STATUSES = [
  { value: 'APPLIED', label: ' Applied', color: '#4f8ef7' },
  { value: 'UNDER_REVIEW', label: ' Under Review', color: '#f59e0b' },
  { value: 'SHORTLISTED', label: ' Shortlisted', color: '#06d6a0' },
  { value: 'INTERVIEW_SCHEDULED', label: ' Interview Scheduled', color: '#7c3aed' },
  { value: 'SELECTED', label: ' Selected', color: '#10b981' },
  { value: 'REJECTED', label: ' Rejected', color: '#ef4444' },
  { value: 'ON_HOLD', label: ' On Hold', color: '#6b7280' }
]


const ACCEPTED_TYPES = {
  'application/pdf': ['.pdf'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
}

export default function UploadResume() {
  const [files, setFiles] = useState([])
  const [resumeStatus, setResumeStatus] = useState('APPLIED')
  const [recruitedFor, setRecruitedFor] = useState('')
  const [candidateNotes, setCandidateNotes] = useState('')
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [results, setResults] = useState(null)
  const [abortController, setAbortController] = useState(null)

  // Block tab-close or refresh during upload
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (uploading) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [uploading])

  // Synchronize upload status globally for SPA components (like Sidebar)
  useEffect(() => {
    window.isUploading = uploading
    return () => {
      window.isUploading = false
    }
  }, [uploading])

  const handleCancelUpload = () => {
    if (abortController) {
      abortController.abort()
      toast.info('Upload process cancelled')
      setUploading(false)
      setProgress(0)
    }
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: ACCEPTED_TYPES,
    multiple: true,
    maxSize: 25 * 1024 * 1024,
    onDrop: (accepted, rejected) => {
      setFiles(prev => {
        const existing = new Set(prev.map(f => f.name))
        const newFiles = accepted.filter(f => !existing.has(f.name))
        return [...prev, ...newFiles]
      })
      if (rejected.length > 0) {
        toast.error(`${rejected.length} file(s) rejected — only PDF/DOC/DOCX under 25MB`)
      }
    }
  })

  const removeFile = (name) => setFiles(prev => prev.filter(f => f.name !== name))
  const clearFiles = () => setFiles([])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (files.length === 0) { toast.error('Please add at least one file'); return }

    setUploading(true)
    setProgress(0)
    setResults(null)

    const ctrl = new AbortController()
    setAbortController(ctrl)

    const formData = new FormData()
    files.forEach(f => formData.append('files', f))
    formData.append('resumeStatus', resumeStatus)
    if (recruitedFor.trim()) formData.append('recruitedFor', recruitedFor.trim())
    if (candidateNotes.trim()) formData.append('candidateNotes', candidateNotes.trim())

    try {
      const { data } = await api.post('/api/resumes/bulk-upload', formData, {
        signal: ctrl.signal,
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (evt) => {
          const pct = Math.round((evt.loaded * 100) / evt.total)
          setProgress(pct)
        }
      })
      setResults(data)
      if (data.failureCount === 0) {
        toast.success(`✅ All ${data.successCount} resume(s) uploaded!`)
      } else {
        toast.warn(`⚠️ ${data.successCount} uploaded, ${data.failureCount} failed`)
      }
      setFiles([])
    } catch (err) {
      if (err.name === 'CanceledError' || err.code === 'ERR_CANCELED') {
        return
      }
      toast.error(err.response?.data?.error || 'Upload failed')
    } finally {
      setUploading(false)
      setProgress(0)
      setAbortController(null)
    }
  }

  return (
    <div className="fade-in">
      <div style={{ marginBottom: 32 }}>
        <h1 className="rms-page-title">
          <i className="bi bi-cloud-arrow-up-fill me-3" style={{ color: 'var(--rms-primary)' }} />
          Bulk Upload
        </h1>
        <p className="rms-page-subtitle">Upload multiple resumes (50+) to the intelligent pipeline automatically</p>
      </div>

      <div className="row g-4">
        {/* LEFT — Form */}
        <div className="col-lg-7">
          <div className="rms-card">
            <form onSubmit={handleSubmit} id="bulk-upload-form">

              {/* Recruited For */}
              <div className="rms-form-group">
                <label className="rms-label" htmlFor="recruited-for">
                  Target Job Position
                </label>
                <input
                  id="recruited-for"
                  type="text"
                  className="rms-input"
                  placeholder="e.g. Senior Fullstack Engineer"
                  value={recruitedFor}
                  onChange={e => setRecruitedFor(e.target.value)}
                />
              </div>

              {/* Candidate Notes */}
              <div className="rms-form-group">
                <label className="rms-label" htmlFor="candidate-notes">
                  Processing Notes
                </label>
                <textarea
                  id="candidate-notes"
                  className="rms-input"
                  rows="2"
                  placeholder="Add any specific context for this batch..."
                  value={candidateNotes}
                  onChange={e => setCandidateNotes(e.target.value)}
                  style={{ resize: 'vertical' }}
                />
              </div>

              {/* Resume Status */}
              <div className="rms-form-group">
                <label className="rms-label">Initial Pipeline Stage</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                  {RESUME_STATUSES.map(s => (
                    <button
                      key={s.value}
                      type="button"
                      onClick={() => setResumeStatus(s.value)}
                      style={{
                        padding: '8px 16px', borderRadius: 10, fontSize: '0.75rem',
                        fontWeight: 700, cursor: 'pointer',
                        border: `1.5px solid ${resumeStatus === s.value ? s.color : 'var(--rms-border)'}`,
                        background: resumeStatus === s.value ? s.color : 'rgba(255,255,255,0.02)',
                        color: resumeStatus === s.value ? '#fff' : 'var(--rms-text-muted)',
                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                        boxShadow: resumeStatus === s.value ? `0 4px 12px ${s.color}44` : 'none'
                      }}>
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Drop Zone */}
              <div className="rms-form-group" style={{ marginTop: 32 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 12 }}>
                  <label className="rms-label" style={{ margin: 0 }}>
                    Resume Assets ({files.length} ready)
                  </label>
                  {files.length > 0 && (
                    <button type="button" onClick={clearFiles}
                      style={{
                        background: 'none', border: 'none',
                        color: 'var(--rms-danger)', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700
                      }}>
                      <i className="bi bi-trash me-1" /> Clear Queue
                    </button>
                  )}
                </div>

                <div {...getRootProps()}
                  className={`rms-dropzone ${isDragActive ? 'active' : ''}`}
                  id="file-dropzone"
                  style={{ padding: '60px 20px' }}>
                  <input {...getInputProps()} id="file-input" />
                  <div style={{ 
                    width: 64, height: 64, borderRadius: '50%', background: 'rgba(99, 102, 241, 0.1)', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' 
                  }}>
                    <i className="bi bi-cloud-plus-fill" style={{ fontSize: '2rem', color: 'var(--rms-primary)' }} />
                  </div>
                  {isDragActive ? (
                    <p style={{ fontWeight: 800, color: 'var(--rms-primary)', fontSize: '1.1rem' }}>Release to Queue</p>
                  ) : (
                    <>
                      <p style={{ fontWeight: 700, fontSize: '1rem', color: '#fff', marginBottom: 4 }}>
                        Drag & drop resumes here
                      </p>
                      <p style={{ fontSize: '0.85rem', color: 'var(--rms-text-muted)', margin: 0 }}>
                        PDF, DOCX supported up to 25MB
                      </p>
                    </>
                  )}
                </div>

                {/* File list */}
                {files.length > 0 && (
                  <div style={{ marginTop: 20, maxHeight: 240, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {files.map((f, i) => (
                      <div key={f.name + i} style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: '10px 16px',
                        border: '1px solid var(--rms-border)'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0, flex: 1 }}>
                          <i className="bi bi-file-earmark-text" style={{ color: 'var(--rms-primary)', flexShrink: 0 }} />
                          <span style={{ fontSize: '0.85rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {f.name}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--rms-text-dim)', flexShrink: 0 }}>
                            {(f.size / 1024).toFixed(0)} KB
                          </span>
                        </div>
                        <button type="button" onClick={() => removeFile(f.name)}
                          style={{ background: 'none', border: 'none', color: 'var(--rms-text-dim)', cursor: 'pointer', padding: 4 }}>
                          <i className="bi bi-x-lg" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Progress */}
              {uploading && (
                <div style={{ marginBottom: 24, marginTop: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: '0.85rem' }}>
                    <span style={{ color: 'var(--rms-text-muted)', fontWeight: 600 }}>Streaming data to Cloudinary...</span>
                    <span style={{ color: 'var(--rms-primary)', fontWeight: 800 }}>{progress}%</span>
                  </div>
                  <div style={{ background: 'var(--rms-surface-2)', borderRadius: 999, height: 6, overflow: 'hidden', marginBottom: 12 }}>
                    <div style={{
                      height: '100%', borderRadius: 999, width: `${progress}%`,
                      background: 'linear-gradient(90deg, var(--rms-primary), var(--rms-secondary))',
                      transition: 'width 0.3s ease'
                    }} />
                  </div>
                  <button type="button" onClick={handleCancelUpload}
                    style={{
                      padding: '6px 16px', borderRadius: 10, fontSize: '0.75rem', fontWeight: 700,
                      border: '1.5px solid var(--rms-danger)', background: 'rgba(239, 68, 68, 0.05)',
                      color: 'var(--rms-danger)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'var(--rms-danger)'; e.currentTarget.style.color = '#fff' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.05)'; e.currentTarget.style.color = 'var(--rms-danger)' }}
                  >
                    <i className="bi bi-x-circle-fill" /> Cancel Upload
                  </button>
                </div>
              )}

              <button type="submit" id="upload-submit" className="btn-rms"
                disabled={uploading || files.length === 0}
                style={{ width: '100%', justifyContent: 'center', padding: '18px', fontSize: '1rem', marginTop: 8 }}>
                {uploading
                  ? <><span className="spinner-border spinner-border-sm me-3" />Processing Batch...</>
                  : <><i className="bi bi-send-fill" /> Start Upload Process</>}
              </button>
            </form>
          </div>
        </div>

        {/* RIGHT — Results */}
        <div className="col-lg-5">
          {results ? (
            <div className="rms-card fade-in" style={{ borderColor: 'var(--rms-accent)44' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(6, 214, 160, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--rms-accent)' }}>
                  <i className="bi bi-check-all" style={{ fontSize: '1.5rem' }} />
                </div>
                <h3 style={{ fontSize: '1.1rem', margin: 0 }}>Process Complete</h3>
              </div>

              {/* Summary counters */}
              <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
                <div style={{
                  flex: 1, background: 'rgba(6,214,160,0.05)',
                  border: '1px solid rgba(6,214,160,0.1)', borderRadius: 12,
                  padding: '16px', textAlign: 'center'
                }}>
                  <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--rms-accent)', fontFamily: 'Outfit, sans-serif' }}>
                    {results.successCount}
                  </div>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--rms-text-dim)', textTransform: 'uppercase' }}>Ingested</div>
                </div>
                {results.failureCount > 0 && (
                  <div style={{
                    flex: 1, background: 'rgba(239,68,68,0.05)',
                    border: '1px solid rgba(239,68,68,0.1)', borderRadius: 12,
                    padding: '16px', textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--rms-danger)', fontFamily: 'Outfit, sans-serif' }}>
                      {results.failureCount}
                    </div>
                    <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--rms-text-dim)', textTransform: 'uppercase' }}>Bypassed</div>
                  </div>
                )}
              </div>

              {/* Uploaded file list */}
              <div style={{ maxHeight: 380, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {results.uploaded.map(r => (
                  <div key={r.id} style={{
                    background: 'rgba(255,255,255,0.02)', borderRadius: 10, padding: '12px',
                    border: '1px solid var(--rms-border)',
                    display: 'flex', alignItems: 'center', gap: 12
                  }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--rms-accent)' }} />
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {r.fileName}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--rms-text-dim)', marginTop: 2 }}>{r.resumeStatus}</div>
                    </div>
                    <ResumeViewButton resumeId={r.id} publicUrl={r.signedUrl} hasFile={!!r.signedUrl} 
                      style={{ padding: '6px 12px', fontSize: '0.7rem' }} />
                  </div>
                ))}
                {results.errors.map((err, i) => (
                  <div key={i} style={{
                    background: 'rgba(239,68,68,0.03)', borderRadius: 10, padding: '12px',
                    border: '1px solid rgba(239,68,68,0.1)',
                    fontSize: '0.8rem', color: 'var(--rms-danger)', display: 'flex', gap: 10
                  }}>
                    <i className="bi bi-exclamation-triangle" style={{ flexShrink: 0 }} />
                    {err}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="rms-card" style={{ textAlign: 'center', padding: '80px 40px', borderStyle: 'dashed' }}>
              <div style={{ 
                width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,0.02)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px',
                color: 'var(--rms-text-dim)'
              }}>
                <i className="bi bi-stack" style={{ fontSize: '2.5rem' }} />
              </div>
              <h3 style={{ fontSize: '1.1rem', color: '#fff', marginBottom: 8 }}>Queue Summary</h3>
              <p style={{ color: 'var(--rms-text-dim)', fontSize: '0.875rem', lineHeight: 1.5 }}>
                Ready to process your bulk batch. Ingested data will appear here in real-time.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function StatusPill({ status }) {
  const MAP = {
    APPLIED: { label: 'Applied', color: '#4f8ef7' },
    UNDER_REVIEW: { label: 'Under Review', color: '#f59e0b' },
    SHORTLISTED: { label: 'Shortlisted', color: '#06d6a0' },
    INTERVIEW_SCHEDULED: { label: 'Interview Scheduled', color: '#7c3aed' },
    SELECTED: { label: 'Selected', color: '#10b981' },
    REJECTED: { label: 'Rejected', color: '#ef4444' },
    ON_HOLD: { label: 'On Hold', color: '#6b7280' }
  }
  const s = MAP[status]
  if (!s) return null
  return (
    <span style={{
      display: 'inline-block', marginTop: 3, padding: '1px 8px', borderRadius: 999,
      fontSize: '0.7rem', fontWeight: 700, background: s.color + '22', color: s.color
    }}>
      {s.label}
    </span>
  )
}
