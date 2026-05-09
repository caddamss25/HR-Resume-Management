import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import { toast } from 'react-toastify'
import ResumeViewButton from '../components/ResumeViewButton'
import { formatDate } from '../utils/formatDate'

// ── Pipeline stages — ordered like a real ATS (Zoho Recruit / Catalyst style)
const STAGES = [
  { key: 'APPLIED', label: 'Applied', icon: 'bi-inbox-fill', color: '#4f8ef7', bg: 'rgba(79,142,247,0.1)' },
  { key: 'UNDER_REVIEW', label: 'Under Review', icon: 'bi-eye-fill', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  { key: 'SHORTLISTED', label: 'Shortlisted', icon: 'bi-star-fill', color: '#06d6a0', bg: 'rgba(6,214,160,0.1)' },
  { key: 'INTERVIEW_SCHEDULED', label: 'Interview Scheduled', icon: 'bi-calendar-check-fill', color: '#7c3aed', bg: 'rgba(124,58,237,0.1)' },
  { key: 'SELECTED', label: 'Selected', icon: 'bi-trophy-fill', color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
  { key: 'ON_HOLD', label: 'On Hold', icon: 'bi-pause-circle-fill', color: '#8b949e', bg: 'rgba(139,148,158,0.1)' },
  { key: 'REJECTED', label: 'Rejected', icon: 'bi-x-circle-fill', color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
]

const STAGE_MAP = Object.fromEntries(STAGES.map(s => [s.key, s]))

// ── Allowed next transitions per stage (Zoho-style linear pipeline)
const TRANSITIONS = {
  APPLIED: ['UNDER_REVIEW', 'REJECTED', 'ON_HOLD'],
  UNDER_REVIEW: ['SHORTLISTED', 'REJECTED', 'ON_HOLD'],
  SHORTLISTED: ['INTERVIEW_SCHEDULED', 'REJECTED', 'ON_HOLD'],
  INTERVIEW_SCHEDULED: ['SELECTED', 'REJECTED', 'ON_HOLD'],
  SELECTED: ['ON_HOLD'],
  ON_HOLD: ['UNDER_REVIEW', 'SHORTLISTED', 'REJECTED'],
  REJECTED: ['ON_HOLD'],
}

export default function Pipeline() {
  const navigate = useNavigate()
  const [resumes, setResumes] = useState([])
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState(null)
  const [expandedId, setExpandedId] = useState(null)
  const [filterName, setFilterName] = useState('')
  const [draggedId, setDraggedId] = useState(null)
  const [dragOverStage, setDragOverStage] = useState(null)
  const [view, setView] = useState('list') // 'list'
  const [limits, setLimits] = useState({}) // Pagination limits per stage (Kanban)
  const [listLimit, setListLimit] = useState(10) // Pagination limit (List)

  useEffect(() => { fetchResumes() }, [])

  const fetchResumes = async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/api/resumes')
      setResumes(data)
    } catch { toast.error('Failed to load pipeline') }
    finally { setLoading(false) }
  }

  // ── Status update
  const moveStage = async (resumeId, newStatus) => {
    setUpdatingId(resumeId)
    setExpandedId(null)
    try {
      const { data } = await api.patch(`/api/resumes/${resumeId}/status?resumeStatus=${newStatus}`)
      setResumes(prev => prev.map(r => r.id === resumeId ? { ...r, resumeStatus: data.resumeStatus } : r))
      const stage = STAGE_MAP[newStatus]
      toast.success(`Moved to ${stage?.label}`)
    } catch (err) {
      toast.error(err.response?.data?.error || 'Status update failed')
    } finally { setUpdatingId(null) }
  }

  // ── Drag and drop handlers
  const handleDragStart = (e, resumeId) => {
    setDraggedId(resumeId)
    e.dataTransfer.effectAllowed = 'move'
  }
  const handleDragOver = (e, stageKey) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverStage(stageKey)
  }
  const handleDrop = (e, stageKey) => {
    e.preventDefault()
    setDragOverStage(null)
    if (!draggedId) return
    const resume = resumes.find(r => r.id === draggedId)
    if (!resume || resume.resumeStatus === stageKey) { setDraggedId(null); return }
    moveStage(draggedId, stageKey)
    setDraggedId(null)
  }

  // ── Filter
  const filtered = resumes.filter(r =>
    !filterName ||
    r.fileName?.toLowerCase().includes(filterName.toLowerCase()) ||
    r.candidateName?.toLowerCase().includes(filterName.toLowerCase())
  )

  // ── Group by stage
  const byStage = Object.fromEntries(STAGES.map(s => [
    s.key,
    filtered.filter(r => r.resumeStatus === s.key)
  ]))

  // ── Funnel conversion rates
  const total = resumes.length
  const counts = Object.fromEntries(STAGES.map(s => [s.key, (byStage[s.key] || []).length]))

  if (loading) return <div className="rms-spinner"><div className="spinner-border text-primary" /></div>

  return (
    <div className="fade-in">

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
        <div>
          <h1 className="rms-page-title" style={{ marginBottom: 2 }}>
            <i className="bi bi-diagram-3-fill me-2" style={{ color: 'var(--rms-primary)' }} />
            Hiring Pipeline
          </h1>
          <p className="rms-page-subtitle" style={{ marginBottom: 0 }}>
            Track every resume through your hiring funnel · Drag cards to move stages
          </p>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Search */}
          <div style={{ position: 'relative' }}>
            <i className="bi bi-search" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--rms-text-muted)', fontSize: '0.9rem' }} />
            <input className="rms-input" placeholder="Search candidates..."
              value={filterName} onChange={e => setFilterName(e.target.value)}
              style={{ paddingLeft: 40, width: 240, borderRadius: 999 }} />
          </div>
          {/* View toggle */}
          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(8px)', borderRadius: 8, padding: 4, border: '1px solid rgba(255,255,255,0.1)' }}>
            {[{ k: 'kanban', icon: 'bi-kanban', label: 'Board' }, { k: 'list', icon: 'bi-list-ul', label: 'List' }].map(v => (
              <button key={v.k} onClick={() => { setView(v.k); setListLimit(10); }} style={{
                padding: '6px 14px', border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, borderRadius: 6,
                background: view === v.k ? 'var(--rms-primary)' : 'transparent',
                color: view === v.k ? '#fff' : 'var(--rms-text-muted)', transition: 'all 0.2s ease',
              }}>
                <i className={`bi ${v.icon} me-2`} />{v.label}
              </button>
            ))}
          </div>
          <button className="btn-rms-outline" onClick={fetchResumes} style={{ borderRadius: 8, width: 36, height: 36, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <i className="bi bi-arrow-clockwise" style={{ fontSize: '1rem' }} />
          </button>
        </div>
      </div>

      {/* ── DASHBOARD TOP METRICS ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20, marginBottom: 30 }}>
        {[
          { label: 'Total Candidates', value: total, icon: 'bi-people-fill', color: '#4f8ef7', bg: 'rgba(79,142,247,0.1)' },
          { label: 'Shortlisted', value: counts['SHORTLISTED'] || 0, icon: 'bi-star-fill', color: '#06d6a0', bg: 'rgba(6,214,160,0.1)' },
          { label: 'Interviews', value: counts['INTERVIEW_SCHEDULED'] || 0, icon: 'bi-calendar-check-fill', color: '#7c3aed', bg: 'rgba(124,58,237,0.1)' },
          { label: 'Hired', value: counts['SELECTED'] || 0, icon: 'bi-trophy-fill', color: '#10b981', bg: 'rgba(16,185,129,0.1)' }
        ].map((stat, i) => (
          <div key={i} style={{
            background: 'var(--rms-surface)', border: '1px solid var(--rms-border)', borderRadius: 12, padding: '20px',
            display: 'flex', alignItems: 'center', gap: 16, boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
          }}>
            <div style={{ width: 50, height: 50, borderRadius: 12, background: stat.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className={`bi ${stat.icon}`} style={{ fontSize: '1.5rem', color: stat.color }} />
            </div>
            <div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--rms-text)', lineHeight: 1.2 }}>{stat.value}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--rms-text-muted)', fontWeight: 600 }}>{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── LIST VIEW ── */}
      {view === 'list' && (
        <div className="fade-in rms-card" style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'var(--rms-surface-2)', borderBottom: '1px solid var(--rms-border)' }}>
                <th style={{ padding: '16px', fontSize: '0.8rem', color: 'var(--rms-text-muted)', fontWeight: 600 }}>Candidate</th>
                <th style={{ padding: '16px', fontSize: '0.8rem', color: 'var(--rms-text-muted)', fontWeight: 600 }}>Role</th>
                <th style={{ padding: '16px', fontSize: '0.8rem', color: 'var(--rms-text-muted)', fontWeight: 600 }}>Stage</th>
                <th style={{ padding: '16px', fontSize: '0.8rem', color: 'var(--rms-text-muted)', fontWeight: 600 }}>Date</th>
                <th style={{ padding: '16px', fontSize: '0.8rem', color: 'var(--rms-text-muted)', fontWeight: 600 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan="5" style={{ padding: '40px', textAlign: 'center', color: 'var(--rms-text-muted)' }}>No candidates found.</td></tr>
              ) : filtered.slice(0, listLimit).map(r => {
                const s = STAGE_MAP[r.resumeStatus]
                return (
                  <tr key={r.id} 
                    style={{ borderBottom: '1px solid var(--rms-border)', transition: 'background 0.2s', cursor: 'pointer' }} 
                    onClick={() => r.candidateId && navigate(`/candidates/${r.candidateId}`)}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'} 
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: s?.bg || '#333', color: s?.color || '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.8rem' }}>
                          {(r.candidateName || r.fileName)?.[0]?.toUpperCase()}
                        </div>
                        <span style={{ fontWeight: 600, color: 'var(--rms-text)', fontSize: '0.9rem' }}>{r.candidateName || r.fileName.replace('.pdf', '')}</span>
                      </div>
                    </td>
                    <td style={{ padding: '16px', color: 'var(--rms-text-muted)', fontSize: '0.85rem' }}>{r.recruitedFor || '-'}</td>
                    <td style={{ padding: '16px' }}>
                      <span style={{ padding: '4px 10px', borderRadius: 6, background: s?.bg, color: s?.color, fontSize: '0.75rem', fontWeight: 700, border: `1px solid ${s?.color}44` }}>
                        {s?.label || r.resumeStatus}
                      </span>
                    </td>
                    <td style={{ padding: '16px', color: 'var(--rms-text-muted)', fontSize: '0.85rem' }}>{formatDate(r.uploadedAt)}</td>
                    <td style={{ padding: '16px' }}>
                      <ResumeViewButton resumeId={r.id} publicUrl={r.signedUrl} hasFile={!!r.signedUrl} label="View PDF" />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {filtered.length > listLimit && (
            <div style={{ padding: '16px', textAlign: 'center', background: 'var(--rms-surface-2)', borderTop: '1px solid var(--rms-border)' }}>
              <button
                onClick={() => setListLimit(p => p + 10)}
                style={{
                  padding: '8px 24px', borderRadius: 8, background: 'var(--rms-surface)', border: '1px solid var(--rms-border)',
                  color: 'var(--rms-text)', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s'
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--rms-primary)'; e.currentTarget.style.color = 'var(--rms-primary)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--rms-border)'; e.currentTarget.style.color = 'var(--rms-text)'; }}
              >
                Load More Candidates ({filtered.length - listLimit} left)
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── KANBAN BOARD VIEW ── */}
      {view === 'kanban' && (
        <div className="fade-in" style={{ overflowX: 'auto', paddingBottom: 24, paddingRight: 20 }}>
          <div style={{ display: 'flex', gap: 24, minWidth: 'max-content', alignItems: 'flex-start' }}>
            {STAGES.map((stage) => (
              <DashboardKanbanColumn
                key={stage.key} stage={stage} byStage={byStage} limits={limits} setLimits={setLimits}
                dragOverStage={dragOverStage} handleDragOver={handleDragOver} setDragOverStage={setDragOverStage}
                handleDrop={handleDrop} updatingId={updatingId} moveStage={moveStage} handleDragStart={handleDragStart}
                navigate={navigate}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Dashboard Kanban Column Component ──
function DashboardKanbanColumn({ stage, byStage, limits, setLimits, dragOverStage, handleDragOver, setDragOverStage, handleDrop, updatingId, moveStage, handleDragStart, navigate }) {
  const allCards = byStage[stage.key] || []
  const limit = limits[stage.key] || 10
  const cards = allCards.slice(0, limit)
  const hasMore = allCards.length > limit
  const isOver = dragOverStage === stage.key

  return (
    <div
      onDragOver={e => handleDragOver(e, stage.key)}
      onDragLeave={() => setDragOverStage(null)}
      onDrop={e => handleDrop(e, stage.key)}
      style={{
        width: 310, minHeight: 200, borderRadius: 16,
        background: isOver ? `${stage.color}08` : 'rgba(21, 25, 33, 0.4)',
        border: `1px solid ${isOver ? stage.color : 'rgba(255, 255, 255, 0.05)'}`,
        backdropFilter: 'blur(10px)',
        display: 'flex', flexDirection: 'column', flexShrink: 0,
        transition: 'all 0.2s ease'
      }}
    >
      {/* Header */}
      <div style={{
        padding: '18px 20px', borderBottom: '1px solid var(--rms-border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: stage.color, boxShadow: `0 0 10px ${stage.color}88` }} />
          <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#fff', letterSpacing: '0.01em' }}>{stage.label}</span>
        </div>
        <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--rms-text-muted)', background: 'var(--rms-surface-2)', padding: '2px 10px', borderRadius: 999 }}>
          {allCards.length}
        </span>
      </div>

      {/* Body */}
      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 14, flex: 1, maxHeight: 'calc(100vh - 350px)', overflowY: 'auto' }}>
        {allCards.length === 0 && (
          <div style={{ textAlign: 'center', color: 'var(--rms-text-dim)', fontSize: '0.8rem', padding: '40px 0', border: '1px dashed rgba(255,255,255,0.05)', borderRadius: 12 }}>
            No candidates
          </div>
        )}
        {cards.map(r => (
          <DashboardKanbanCard
            key={r.id} resume={r} stage={stage}
            updatingId={updatingId} moveStage={moveStage} onDragStart={handleDragStart}
            navigate={navigate}
          />
        ))}
        {hasMore && (
          <button
            onClick={() => setLimits(prev => ({ ...prev, [stage.key]: limit + 10 }))}
            style={{ width: '100%', padding: '12px', fontSize: '0.8rem', background: 'var(--rms-surface-2)', border: 'none', borderRadius: 10, color: '#fff', fontWeight: 600, cursor: 'pointer', transition: 'background 0.2s' }}
          >
            Show {allCards.length - limit} More
          </button>
        )}
      </div>
    </div>
  )
}

// ── Dashboard Card Component ──
function DashboardKanbanCard({ resume, stage, updatingId, moveStage, onDragStart, navigate }) {
  const isUpdating = updatingId === resume.id
  const next = TRANSITIONS[resume.resumeStatus] || []

  return (
    <div
      draggable
      onDragStart={e => onDragStart(e, resume.id)}
      onClick={(e) => {
        // Only navigate if we didn't click a button or resume viewer
        if (!e.target.closest('button') && !e.target.closest('.rms-view-btn') && resume.candidateId) {
          navigate(`/candidates/${resume.candidateId}`);
        }
      }}
      style={{
        background: 'rgba(22, 27, 34, 0.8)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 12, padding: '16px 14px',
        cursor: 'pointer', userSelect: 'none',
        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
        opacity: isUpdating ? 0.6 : 1,
        position: 'relative', overflow: 'hidden',
        flexShrink: 0
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = stage.color; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 8px 24px ${stage.color}22` }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)' }}
    >
      {/* Accent Line */}
      <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: 4, background: stage.color }} />

      {/* Header: Avatar, Name, Job Role */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, paddingLeft: 6, marginBottom: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: stage.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: stage.color, fontWeight: 800, fontSize: '0.9rem', flexShrink: 0 }}>
              {(resume.candidateName || resume.fileName)?.[0]?.toUpperCase()}
            </div>
            <span style={{
              fontSize: '0.95rem', fontWeight: 700,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              color: 'var(--rms-text)'
            }} title={resume.candidateName || resume.fileName}>
              {resume.candidateName || resume.fileName.replace('.pdf', '')}
            </span>
          </div>
          {resume.recruitedFor && (
            <div style={{ fontSize: '0.75rem', color: 'var(--rms-text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <i className="bi bi-briefcase-fill" style={{ color: stage.color }} />
              {resume.recruitedFor}
            </div>
          )}
        </div>
        {isUpdating && <span className="spinner-border spinner-border-sm" style={{ color: stage.color, flexShrink: 0 }} />}
      </div>

      {/* Meta & View Resume */}
      <div style={{ paddingLeft: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div style={{ fontSize: '0.72rem', color: 'var(--rms-text-muted)' }}>
          <i className="bi bi-calendar3 me-1" />{formatDate(resume.uploadedAt)}
        </div>
        <ResumeViewButton
          resumeId={resume.id}
          publicUrl={resume.signedUrl}
          hasFile={!!resume.signedUrl}
          label="View PDF"
          style={{
            fontSize: '0.72rem', padding: '4px 10px', borderRadius: 999,
            background: 'rgba(79, 142, 247, 0.1)', color: 'var(--rms-primary)', border: '1px solid rgba(79, 142, 247, 0.2)'
          }}
        />
      </div>

      {/* Move to next stage buttons */}
      {next.length > 0 && (
        <div style={{ paddingLeft: 6, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ fontSize: '0.65rem', color: 'var(--rms-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
            Quick Move
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {next.map(targetKey => {
              const target = STAGE_MAP[targetKey]
              return (
                <button key={targetKey}
                  onClick={() => moveStage(resume.id, targetKey)}
                  style={{
                    padding: '4px 10px', borderRadius: 6, fontSize: '0.7rem', fontWeight: 600,
                    background: 'var(--rms-surface-2)', color: 'var(--rms-text-muted)',
                    border: `1px solid var(--rms-border)`, cursor: 'pointer',
                    transition: 'all 0.2s ease', display: 'flex', alignItems: 'center', gap: 4
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = target.bg; e.currentTarget.style.color = target.color; e.currentTarget.style.borderColor = target.color }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'var(--rms-surface-2)'; e.currentTarget.style.color = 'var(--rms-text-muted)'; e.currentTarget.style.borderColor = 'var(--rms-border)' }}
                >
                  <i className={`bi ${target.icon}`} style={{ fontSize: '0.7rem' }} />
                  {target.label}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
