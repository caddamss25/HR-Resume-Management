import { useState, useEffect } from 'react'
import api from '../api/axios'
import { toast } from 'react-toastify'
import { formatDate } from '../utils/formatDate'
import ResumeViewButton from '../components/ResumeViewButton'
import PasswordModal from '../components/PasswordModal'
import JSZip from 'jszip'
import { saveAs } from 'file-saver'

const RESUME_STATUSES = [
  { value: 'APPLIED', label: 'Applied', color: '#4f8ef7' },
  { value: 'UNDER_REVIEW', label: 'Under Review', color: '#f59e0b' },
  { value: 'SHORTLISTED', label: 'Shortlisted', color: '#06d6a0' },
  { value: 'INTERVIEW_SCHEDULED', label: 'Interview Scheduled', color: '#7c3aed' },
  { value: 'SELECTED', label: 'Selected', color: '#10b981' },
  { value: 'REJECTED', label: 'Rejected', color: '#ef4444' },
  { value: 'ON_HOLD', label: 'On Hold', color: '#6b7280' }
]

const STATUS_COLOR = Object.fromEntries(RESUME_STATUSES.map(s => [s.value, s.color]))

const STEPS = { LOAD: 1, DOWNLOAD: 2, CONFIRM: 3, DONE: 4 }


export default function BulkDelete() {
  const [resumes, setResumes] = useState([])
  const [selected, setSelected] = useState(new Set())
  const [loading, setLoading] = useState(true)
  const [step, setStep] = useState(STEPS.LOAD)
  const [password, setPassword] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [deleteResult, setDeleteResult] = useState(null)
  const [downloadDone, setDownloadDone] = useState(false)
  const [purging, setPurging] = useState(false)
  const [purgeResult, setPurgeResult] = useState(null)
  const [purgePassword, setPurgePassword] = useState('')
  const [showPurgeBox, setShowPurgeBox] = useState(false)
  const [editingStatusId, setEditingStatusId] = useState(null)
  const [updatingId, setUpdatingId] = useState(null)
  const [showSelectDropdown, setShowSelectDropdown] = useState(false)


  const [pwdModalConfig, setPwdModalConfig] = useState({ isOpen: false, action: null })

  useEffect(() => { fetchResumes() }, [])

  const fetchResumes = async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/api/resumes/download-all-urls')
      setResumes(data)
      setStep(STEPS.LOAD)
      setSelected(new Set())
      setDownloadDone(false)
    } catch { toast.error('Failed to load resumes') }
    finally { setLoading(false) }
  }

  const toggleSelect = (id) => {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const selectAll = () => setSelected(new Set(resumes.map(r => r.id)))
  const selectNone = () => setSelected(new Set())
  const selectByStatus = (status) => {
    const ids = resumes.filter(r => r.resumeStatus === status).map(r => r.id)
    setSelected(new Set(ids))
    setShowSelectDropdown(false)
  }

  // ── Inline status update ──────────────────────────────────────────
  const handleStatusChange = async (resumeId, newStatus) => {
    setEditingStatusId(null)
    setUpdatingId(resumeId)
    try {
      const { data } = await api.patch(`/api/resumes/${resumeId}/status?resumeStatus=${newStatus}`)
      setResumes(prev => prev.map(r => r.id === resumeId ? { ...r, resumeStatus: data.resumeStatus } : r))
      toast.success(`Status updated to ${newStatus.replace(/_/g, ' ')}`)
    } catch (err) {
      toast.error(err.response?.data?.error || 'Status update failed')
    } finally {
      setUpdatingId(null)
    }
  }

  // Step 1 → Download selected as ZIP
  const handleDownloadAll = async () => {
    if (selected.size === 0) { toast.error('Select at least one resume to delete'); return }
    const toDownload = resumes.filter(r => selected.has(r.id) && r.signedUrl)
    const noUrl = resumes.filter(r => selected.has(r.id) && !r.signedUrl)

    if (toDownload.length === 0) {
      toast.warn(`None of the ${selected.size} selected resume(s) have a download URL. You can still delete the records.`, { autoClose: 6000 })
      setDownloadDone(true)
      setStep(STEPS.CONFIRM)
      return
    }
    if (noUrl.length > 0) toast.warn(`${noUrl.length} file(s) have no URL and will be skipped.`, { autoClose: 5000 })

    const toastId = toast.loading(`Zipping ${toDownload.length} file(s)...`)
    try {
      const zip = new JSZip()
      const folder = zip.folder("Resumes")

      let successCount = 0
      for (const resume of toDownload) {
        try {
          const response = await fetch(resume.signedUrl)
          if (!response.ok) throw new Error('Fetch failed')
          const blob = await response.blob()
          folder.file(resume.fileName, blob)
          successCount++
        } catch (e) {
          console.error("Failed to fetch", resume.fileName, e)
        }
      }

      if (successCount === 0) {
        toast.update(toastId, { render: 'Failed to download files (CORS or network error).', type: 'error', isLoading: false, autoClose: 3000 })
        return
      }

      const zipBlob = await zip.generateAsync({ type: "blob" })
      saveAs(zipBlob, "resumes.zip")

      toast.update(toastId, { render: `Zipped ${successCount} file(s) successfully!`, type: 'success', isLoading: false, autoClose: 3000 })

      setDownloadDone(true)
      setStep(STEPS.CONFIRM)
    } catch (err) {
      toast.update(toastId, { render: 'An error occurred while zipping files.', type: 'error', isLoading: false, autoClose: 3000 })
    }
  }

  // Step 2 → Bulk delete
  const handleBulkDelete = async (pwd) => {
    setDeleting(true)
    try {
      const { data } = await api.delete('/api/resumes/bulk-delete', { data: { ids: Array.from(selected), password: pwd } })
      setDeleteResult(data)
      setStep(STEPS.DONE)
      toast.success(data.message)
      setPwdModalConfig({ isOpen: false, action: null })
    } catch (err) {
      toast.error(err.response?.data?.error || 'Bulk delete failed')
      throw err
    } finally { setDeleting(false) }
  }

  // Purge orphaned records
  const handlePurge = async (pwd) => {
    setPurging(true)
    try {
      const { data } = await api.post('/api/resumes/purge-orphaned', { password: pwd })
      setPurgeResult(data)
      setShowPurgeBox(false)
      toast.success(data.message)
      fetchResumes()
      setPwdModalConfig({ isOpen: false, action: null })
    } catch (err) {
      toast.error(err.response?.data?.error || 'Purge failed')
      throw err
    } finally { setPurging(false) }
  }

  const handlePasswordSubmit = async (pwd) => {
    if (pwdModalConfig.action === 'BULK_DELETE') {
      await handleBulkDelete(pwd);
    } else if (pwdModalConfig.action === 'PURGE') {
      await handlePurge(pwd);
    }
  }

  const orphanedCount = resumes.filter(r => !r.signedUrl).length

  return (
    <div className="fade-in" onClick={() => { setEditingStatusId(null); setShowSelectDropdown(false); }}>


      <PasswordModal
        isOpen={pwdModalConfig.isOpen}
        onClose={() => setPwdModalConfig({ isOpen: false, action: null })}
        onSubmit={handlePasswordSubmit}
        title={pwdModalConfig.action === 'BULK_DELETE' ? 'Confirm Bulk Deletion' : 'Confirm Purge'}
        message={pwdModalConfig.action === 'BULK_DELETE'
          ? `You are about to delete ${selected.size} resume(s). This cannot be undone.`
          : `You are about to purge ${orphanedCount} orphaned records. This cannot be undone.`}
        confirmText={pwdModalConfig.action === 'BULK_DELETE' ? 'Delete Resumes' : 'Purge Records'}
      />

      <h1 className="rms-page-title">Resume Management</h1>
      <p className="rms-page-subtitle">Select resumes → Download Zip → Confirm with password → Delete</p>

      {/* Step Indicator */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 28, flexWrap: 'wrap' }}>
        {[{ n: 1, label: '① Select' }, { n: 2, label: '② Download All' }, { n: 3, label: '③ Confirm & Delete' }].map(s => (
          <div key={s.n} style={{
            padding: '8px 18px', borderRadius: 999, fontSize: '0.82rem', fontWeight: 700,
            background: step >= s.n ? 'var(--rms-primary)' : 'var(--rms-surface-2)',
            color: step >= s.n ? '#fff' : 'var(--rms-text-muted)',
            border: '1px solid var(--rms-border)', transition: 'all 0.2s'
          }}>{s.label}</div>
        ))}
      </div>

      {/* Done state */}
      {step === STEPS.DONE && deleteResult && (
        <div className="rms-card fade-in mb-4" style={{ border: '1px solid var(--rms-accent)' }}>
          <i className="bi bi-check-circle-fill" style={{ color: 'var(--rms-accent)', fontSize: '1.5rem', marginBottom: 12, display: 'block' }} />
          <p style={{ fontWeight: 700, color: 'var(--rms-accent)', marginBottom: 4 }}>{deleteResult.message}</p>
          <p style={{ fontSize: '0.85rem', color: 'var(--rms-text-muted)' }}>{deleteResult.deleted} deleted · {deleteResult.failed} failed</p>
          <button className="btn-rms mt-3" onClick={fetchResumes}><i className="bi bi-arrow-clockwise" /> Refresh List</button>
        </div>
      )}

      {/* Orphaned Records Warning */}
      {!loading && orphanedCount > 0 && step !== STEPS.DONE && (
        <div className="rms-card fade-in mb-4" style={{ border: '1px solid rgba(239,68,68,0.4)', background: 'rgba(239,68,68,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <p style={{ fontWeight: 700, color: 'var(--rms-danger)', marginBottom: 4 }}>
                <i className="bi bi-exclamation-triangle-fill me-2" />
                {orphanedCount} Orphaned Record{orphanedCount > 1 ? 's' : ''} Detected
              </p>
              <p style={{ fontSize: '0.83rem', color: 'var(--rms-text-muted)', margin: 0 }}>
                These DB records point to files that <strong>no longer exist</strong> in Cloudinary.
                Use <em>Purge Orphaned</em> to clean them up.
              </p>
            </div>
            <button id="purge-orphaned-btn" className="btn-rms-danger"
              onClick={(e) => { e.stopPropagation(); setPwdModalConfig({ isOpen: true, action: 'PURGE' }) }}
              style={{ fontSize: '0.82rem', whiteSpace: 'nowrap' }}>
              <i className="bi bi-trash3" /> Purge Orphaned ({orphanedCount})
            </button>
          </div>
          {purgeResult && <p style={{ marginTop: 10, fontSize: '0.82rem', color: 'var(--rms-accent)', fontWeight: 600 }}>✓ {purgeResult.message}</p>}
        </div>
      )}

      {/* Action Bar */}
      {step !== STEPS.DONE && (
        <div className="rms-card mb-4" style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', overflow: 'visible' }}>
          <div style={{ display: 'flex', gap: 8, position: 'relative' }}>
            <button className="btn-rms-outline" onClick={(e) => { e.stopPropagation(); setShowSelectDropdown(!showSelectDropdown) }}
              style={{ padding: '8px 14px', fontSize: '0.82rem', borderColor: showSelectDropdown ? 'var(--rms-primary)' : '' }}>
              <i className="bi bi-check2-square" /> Selection Options <i className={`bi bi-chevron-${showSelectDropdown ? 'up' : 'down'} ms-1`} style={{ fontSize: '0.7rem' }} />
            </button>

            {showSelectDropdown && (
              <div onClick={e => e.stopPropagation()} style={{
                position: 'absolute', top: '110%', left: 0, zIndex: 1001,
                background: 'var(--rms-surface)', border: '1px solid var(--rms-border)',
                borderRadius: 12, minWidth: 200, boxShadow: '0 12px 32px rgba(0,0,0,0.4)',
                overflow: 'hidden', animation: 'fadeIn 0.2s ease-out'
              }}>
                <div onClick={selectAll} className="rms-dropdown-item">
                  <i className="bi bi-check-all" /> Select All ({resumes.length})
                </div>
                <div onClick={selectNone} className="rms-dropdown-item">
                  <i className="bi bi-x-circle" /> Select None
                </div>
                <div style={{ height: 1, background: 'var(--rms-border)', margin: '4px 0' }} />
                <div style={{ padding: '8px 14px', fontSize: '0.65rem', fontWeight: 800, color: 'var(--rms-text-dim)', textTransform: 'uppercase' }}>By Status</div>
                {RESUME_STATUSES.map(s => {
                  const count = resumes.filter(r => r.resumeStatus === s.value).length
                  return (
                    <div key={s.value} onClick={() => selectByStatus(s.value)} className="rms-dropdown-item">
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.color }} />
                      {s.label} ({count})
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <span style={{ color: 'var(--rms-text-muted)', fontSize: '0.85rem' }}>{selected.size} of {resumes.length} selected</span>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 10 }}>
            {step === STEPS.LOAD && (
              <button className="btn-rms" onClick={handleDownloadAll} disabled={selected.size === 0}
                id="download-all-btn" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
                <i className="bi bi-file-earmark-zip" /> Download Selected as ZIP ({selected.size})
              </button>
            )}
            {step === STEPS.CONFIRM && downloadDone && (
              <button className="btn-rms-danger" onClick={() => setPwdModalConfig({ isOpen: true, action: 'BULK_DELETE' })} disabled={deleting} id="confirm-delete-btn">
                {deleting ? <><span className="spinner-border spinner-border-sm me-2" />Deleting...</> : <><i className="bi bi-trash3-fill" /> Delete {selected.size} Resume(s)</>}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Resume Table */}
      {loading ? (
        <div className="rms-spinner"><div className="spinner-border text-primary" /></div>
      ) : resumes.length === 0 ? (
        <div className="rms-empty"><i className="bi bi-inbox" /><p>No resumes in the system</p></div>
      ) : (
        <div className="rms-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="table-responsive">
            <table className="rms-table">
              <thead>
                <tr>
                  <th style={{ width: 44 }}>
                    <input type="checkbox"
                      checked={selected.size === resumes.length && resumes.length > 0}
                      onChange={selected.size === resumes.length ? selectNone : selectAll}
                      style={{ cursor: 'pointer', accentColor: 'var(--rms-primary)', width: 16, height: 16 }} />
                  </th>
                  <th>File Name</th>
                  <th>Candidate</th>
                  <th>Recruited For</th>
                  <th>Status <span style={{ fontSize: '0.65rem', color: 'var(--rms-text-muted)', fontWeight: 400 }}>(click to edit)</span></th>
                  <th>Uploaded</th>
                  <th>View</th>
                </tr>
              </thead>
              <tbody>
                {resumes.map(r => (
                  <tr key={r.id}
                    onClick={() => step === STEPS.LOAD && toggleSelect(r.id)}
                    style={{ cursor: 'pointer', background: selected.has(r.id) ? 'rgba(239,68,68,0.06)' : '' }}>

                    <td onClick={e => e.stopPropagation()}>
                      <input type="checkbox" checked={selected.has(r.id)}
                        onChange={() => toggleSelect(r.id)}
                        style={{ cursor: 'pointer', accentColor: 'var(--rms-danger)', width: 16, height: 16 }} />
                    </td>

                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <i className="bi bi-file-earmark-pdf-fill" style={{ color: '#ef4444' }} />
                        <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>{r.fileName}</span>
                      </div>
                    </td>

                    <td style={{ color: 'var(--rms-text-muted)', fontSize: '0.85rem' }}>{r.candidateName || '—'}</td>
                    <td style={{ color: 'var(--rms-text-muted)', fontSize: '0.82rem' }}>{r.recruitedFor || '—'}</td>

                    {/* ── Editable Status Cell ── */}
                    <td onClick={e => e.stopPropagation()} style={{ position: 'relative' }}>
                      {updatingId === r.id ? (
                        <span className="spinner-border spinner-border-sm" style={{ color: 'var(--rms-primary)' }} />
                      ) : (
                        <div style={{ position: 'relative', display: 'inline-block' }}>
                          <span
                            title="Click to change status"
                            onClick={e => { e.stopPropagation(); setEditingStatusId(editingStatusId === r.id ? null : r.id) }}
                            style={{
                              padding: '3px 10px', borderRadius: 999, fontSize: '0.72rem', fontWeight: 700,
                              background: (STATUS_COLOR[r.resumeStatus] || '#888') + '22',
                              color: STATUS_COLOR[r.resumeStatus] || '#888',
                              cursor: 'pointer', userSelect: 'none',
                              border: `1px solid ${(STATUS_COLOR[r.resumeStatus] || '#888')}44`,
                              display: 'inline-flex', alignItems: 'center', gap: 4
                            }}>
                            {r.resumeStatus?.replace(/_/g, ' ')}
                            <i className="bi bi-pencil" style={{ fontSize: '0.65rem' }} />
                          </span>

                          {editingStatusId === r.id && (
                            <div onClick={e => e.stopPropagation()} style={{
                              position: 'absolute', top: '110%', left: 0, zIndex: 999,
                              background: 'var(--rms-surface)', border: '1px solid var(--rms-border)',
                              borderRadius: 8, minWidth: 195, boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
                              overflow: 'hidden'
                            }}>

                              {RESUME_STATUSES.map(s => (
                                <div key={s.value} onClick={() => handleStatusChange(r.id, s.value)}
                                  style={{
                                    padding: '8px 14px', fontSize: '0.82rem', fontWeight: 600,
                                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
                                    background: r.resumeStatus === s.value ? s.color + '18' : 'transparent',
                                    transition: 'background 0.15s'
                                  }}
                                  onMouseEnter={e => { if (r.resumeStatus !== s.value) e.currentTarget.style.background = 'var(--rms-surface-2)' }}
                                  onMouseLeave={e => { if (r.resumeStatus !== s.value) e.currentTarget.style.background = 'transparent' }}>
                                  {r.resumeStatus === s.value && <i className="bi bi-check2" style={{ color: s.color }} />}
                                  <span style={{ color: s.color }}>{s.label}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </td>

                    <td style={{ color: 'var(--rms-text-muted)', fontSize: '0.82rem' }}>{formatDate(r.uploadedAt)}</td>

                    <td onClick={e => e.stopPropagation()}>
                      <ResumeViewButton resumeId={r.id} publicUrl={r.signedUrl} hasFile={!!r.signedUrl} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
