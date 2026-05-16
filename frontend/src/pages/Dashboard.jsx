import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'
import { formatDate } from '../utils/formatDate'
import ResumeViewButton from '../components/ResumeViewButton'

const STAGES = [
  { key: 'APPLIED', label: 'Applied', color: '#6366f1', icon: 'bi-inbox-fill' },
  { key: 'UNDER_REVIEW', label: 'Reviewing', color: '#f59e0b', icon: 'bi-eye-fill' },
  { key: 'SHORTLISTED', label: 'Shortlisted', color: '#06d6a0', icon: 'bi-check2-circle' },
  { key: 'INTERVIEW_SCHEDULED', label: 'Interview', color: '#a855f7', icon: 'bi-calendar3' },
  { key: 'SELECTED', label: 'Hired', color: '#10b981', icon: 'bi-award-fill' },
]

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good Morning'
  if (h < 17) return 'Good Afternoon'
  return 'Good Evening'
}

export default function Dashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState({ candidates: 0, resumes: 0 })
  const [pipelineCounts, setPipelineCounts] = useState({})
  const [recent, setRecent] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const [countRes, resumeCountRes, recentRes, allResumes] = await Promise.all([
          api.get('/api/candidates/count'),
          api.get('/api/resumes/count'),
          api.get('/api/resumes/recent?count=6'),
          api.get('/api/resumes')
        ])
        setStats({ candidates: countRes.data.count, resumes: resumeCountRes.data.count })
        setRecent(recentRes.data)

        const counts = {}
        allResumes.data.forEach(r => {
          counts[r.resumeStatus] = (counts[r.resumeStatus] || 0) + 1
        })
        setPipelineCounts(counts)
      } catch (err) {
        console.error('Dashboard fetch error:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) {
    return <div className="rms-spinner"><div className="spinner-border text-primary" /></div>
  }

  const totalPipeline = (pipelineCounts['UNDER_REVIEW'] || 0) + (pipelineCounts['SHORTLISTED'] || 0)
  const hired = pipelineCounts['SELECTED'] || 0
  const maxStage = Math.max(...STAGES.map(s => pipelineCounts[s.key] || 0), 1)

  const METRICS = [
    {
      label: 'Active Candidates',
      val: stats.candidates,
      color: '#6366f1',
      grad: 'linear-gradient(135deg,#6366f1,#818cf8)',
      icon: 'bi-people-fill',

      sub: 'total in system'
    },
    {
      label: 'Total Resumes',
      val: stats.resumes,
      color: '#a855f7',
      grad: 'linear-gradient(135deg,#a855f7,#c084fc)',
      icon: 'bi-file-earmark-pdf-fill',

      sub: 'uploaded'
    },
    {
      label: 'In Pipeline',
      val: totalPipeline,
      color: '#f59e0b',
      grad: 'linear-gradient(135deg,#f59e0b,#fbbf24)',
      icon: 'bi-funnel-fill',

      sub: 'under review'
    },
    {
      label: 'Total Hired',
      val: hired,
      color: '#10b981',
      grad: 'linear-gradient(135deg,#06d6a0,#10b981)',
      icon: 'bi-award-fill',

      sub: 'selected candidates'
    },
  ]

  return (
    <div className="fade-in pb-5">

      {/* ── Page Header ── */}
      <div className="dash-header">
        <div>
          <div style={{ fontSize: '0.85rem', color: 'var(--rms-text-muted)', fontWeight: 500, marginBottom: 4 }}>
            {getGreeting()}, <strong style={{ color: 'var(--rms-primary)' }}>{user?.name}</strong>
          </div>
          <h1 className="rms-page-title" style={{ fontSize: '1.85rem', marginBottom: 0 }}>
            Dashboard <span style={{ fontWeight: 400, color: 'var(--rms-text-dim)', fontSize: '1.1rem' }}>/ Overview</span>
          </h1>
        </div>
        <div style={{
          display: 'inline-flex', background: 'var(--rms-surface)', padding: '8px 18px',
          borderRadius: 12, border: '1px solid var(--rms-border)', alignItems: 'center', gap: 10,
          flexShrink: 0
        }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--rms-accent)', boxShadow: '0 0 10px var(--rms-accent)', animation: 'pulse 2s infinite' }} />
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--rms-text-muted)' }}>System Online</span>
          <span style={{ fontSize: '0.75rem', opacity: 0.45 }}>| {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
        </div>
      </div>

      {/* ── Metric Cards ── */}
      <div className="row g-4 mb-4">
        {METRICS.map((m, i) => (
          <div key={i} className="col-sm-6 col-xl-3">
            <div className="rms-card h-100 dash-metric-card" style={{ padding: '22px 24px', overflow: 'hidden' }}>
              {/* Background glow */}
              <div style={{
                position: 'absolute', inset: 0, opacity: 0.04,
                background: m.grad, borderRadius: 16, pointerEvents: 'none'
              }} />
              <div style={{ position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                  <div style={{
                    width: 46, height: 46, borderRadius: 13, background: m.grad,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1.2rem', color: '#fff',
                    boxShadow: `0 6px 20px ${m.color}40`
                  }}>
                    <i className={`bi ${m.icon}`} />
                  </div>
                  {/* <span style={{
                    fontSize: '0.68rem', fontWeight: 700, padding: '3px 9px', borderRadius: 6,
                    background: 'rgba(6,214,160,0.12)', color: 'var(--rms-accent)',
                    border: '1px solid rgba(6,214,160,0.2)'
                  }}>
                    {m.trend}
                  </span> */}
                </div>
                <div style={{ fontSize: '2.1rem', fontWeight: 800, color: '#fff', fontFamily: 'Outfit, sans-serif', lineHeight: 1 }}>{m.val}</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--rms-text)', marginTop: 4 }}>{m.label}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--rms-text-dim)', marginTop: 2 }}>{m.sub}</div>
                {/* Mini progress strip */}
                <div style={{ height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 2, marginTop: 16, overflow: 'hidden' }}>
                  <div style={{ width: `${Math.min(100, (m.val / Math.max(stats.resumes, 1)) * 100)}%`, height: '100%', background: m.grad, borderRadius: 2 }} />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Main Content Row ── */}
      <div className="row g-4">

        {/* Left Column: Pipeline + Recent Applications */}
        <div className="col-xl-8">

          {/* Pipeline Chart */}
          <div className="rms-card mb-4" style={{ padding: '28px 32px' }}>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <div>
                <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0 }}>Recruitment Pipeline</h2>
                <p style={{ fontSize: '0.8rem', color: 'var(--rms-text-dim)', margin: '2px 0 0' }}>Status breakdown across all stages</p>
              </div>
              <Link to="/pipeline" style={{
                fontSize: '0.8rem', color: 'var(--rms-primary)', textDecoration: 'none', fontWeight: 600,
                display: 'flex', alignItems: 'center', gap: 4, padding: '6px 14px',
                background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 8,
                transition: 'all 0.2s'
              }}>
                View All <i className="bi bi-arrow-right" />
              </Link>
            </div>

            {/* Bar chart rows */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {STAGES.map((s, i) => {
                const count = pipelineCounts[s.key] || 0
                const pct = Math.round((count / maxStage) * 100)
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 30, height: 30, borderRadius: 8, background: `${s.color}18`, color: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', flexShrink: 0 }}>
                      <i className={`bi ${s.icon}`} />
                    </div>
                    <div style={{ width: 90, fontSize: '0.8rem', fontWeight: 600, color: 'var(--rms-text-muted)', flexShrink: 0 }}>{s.label}</div>
                    <div style={{ flex: 1, height: 10, background: 'rgba(255,255,255,0.05)', borderRadius: 999, overflow: 'hidden' }}>
                      <div style={{
                        width: `${Math.max(pct, count > 0 ? 4 : 0)}%`, height: '100%',
                        background: `linear-gradient(90deg, ${s.color}, ${s.color}bb)`,
                        borderRadius: 999, transition: 'width 0.6s cubic-bezier(0.4,0,0.2,1)'
                      }} />
                    </div>
                    <div style={{ width: 32, textAlign: 'right', fontSize: '0.9rem', fontWeight: 800, color: s.color, flexShrink: 0 }}>{count}</div>
                  </div>
                )
              })}
            </div>

            {/* Summary Footer */}
            <div style={{ display: 'flex', gap: 24, marginTop: 20, paddingTop: 18, borderTop: '1px solid var(--rms-border)', flexWrap: 'wrap' }}>
              {[
                { label: 'Total Resumes', val: stats.resumes, color: 'var(--rms-text-muted)' },
                { label: 'Active Pipeline', val: totalPipeline, color: '#f59e0b' },
                { label: 'Conversion Rate', val: stats.resumes > 0 ? `${Math.round((hired / stats.resumes) * 100)}%` : '0%', color: '#10b981' },
              ].map((s, i) => (
                <div key={i}>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: s.color, fontFamily: 'Outfit, sans-serif' }}>{s.val}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--rms-text-dim)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Applications Table */}
          <div className="rms-card">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <div>
                <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0 }}>Recent Applications</h2>
                <p style={{ fontSize: '0.8rem', color: 'var(--rms-text-dim)', margin: '2px 0 0' }}>Latest 6 resume submissions</p>
              </div>
              <Link to="/candidates" style={{ fontSize: '0.78rem', color: 'var(--rms-text-muted)', textDecoration: 'none', fontWeight: 500 }}>
                View all <i className="bi bi-chevron-right" />
              </Link>
            </div>
            {recent.length === 0 ? (
              <div className="text-center py-5">
                <i className="bi bi-inbox text-muted" style={{ fontSize: '2.5rem', opacity: 0.3 }} />
                <p className="mt-2 text-muted">No applications yet</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="rms-table">
                  <thead>
                    <tr>
                      <th>Candidate</th>
                      <th>Role</th>
                      <th>Stage</th>
                      <th style={{ textAlign: 'right' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recent.map(r => {
                      const stage = STAGES.find(s => s.key === r.resumeStatus)
                      return (
                        <tr key={r.id}>
                          <td>
                            <div className="d-flex align-items-center gap-3">
                              <div style={{
                                width: 34, height: 34, borderRadius: 9,
                                background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: '#fff', fontSize: '0.8rem', fontWeight: 800, flexShrink: 0
                              }}>
                                {r.candidateName ? r.candidateName[0].toUpperCase() : 'C'}
                              </div>
                              <div>
                                <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--rms-text)' }}>{r.candidateName || r.fileName?.split('.')[0]}</div>
                                <div style={{ fontSize: '0.72rem', color: 'var(--rms-text-dim)' }}>{formatDate(r.uploadedAt)}</div>
                              </div>
                            </div>
                          </td>
                          <td style={{ fontSize: '0.85rem', color: 'var(--rms-text-muted)' }}>{r.recruitedFor || 'General'}</td>
                          <td>
                            <span style={{
                              padding: '3px 10px', borderRadius: 999, fontSize: '0.65rem', fontWeight: 800,
                              background: `${stage?.color || '#888'}18`,
                              color: stage?.color || '#888',
                              border: `1px solid ${stage?.color || '#888'}33`,
                              textTransform: 'uppercase', letterSpacing: '0.04em'
                            }}>
                              {r.resumeStatus?.replace(/_/g, ' ')}
                            </span>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <ResumeViewButton resumeId={r.id} publicUrl={r.signedUrl} hasFile={!!r.signedUrl} />
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Quick Actions + Tip */}
        <div className="col-xl-4">

          {/* Quick Actions */}
          <div className="rms-card mb-4">
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: 20 }}>Quick Actions</h2>
            <div className="d-grid gap-3">
              <Link to="/upload" className="btn-rms" style={{ padding: '13px 16px', justifyContent: 'center', textDecoration: 'none' }}>
                <i className="bi bi-cloud-arrow-up-fill" /> Bulk Upload Resumes
              </Link>
              <Link to="/candidates" className="btn-rms-outline" style={{ padding: '12px 16px', justifyContent: 'center', textDecoration: 'none' }}>
                <i className="bi bi-people" /> Candidate Directory
              </Link>
              <Link to="/search" className="btn-rms-outline" style={{ padding: '12px 16px', justifyContent: 'center', textDecoration: 'none' }}>
                <i className="bi bi-search" /> Search AI Database
              </Link>
              <Link to="/pipeline" className="btn-rms-outline" style={{ padding: '12px 16px', justifyContent: 'center', textDecoration: 'none' }}>
                <i className="bi bi-diagram-3" /> View Pipeline
              </Link>
            </div>
          </div>

          {/* Stage Summary Mini Cards */}
          <div className="rms-card mb-4" style={{ padding: '22px 24px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 16 }}>Pipeline Snapshot</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {STAGES.map((s, i) => (
                <div key={i} style={{
                  padding: '12px 14px', borderRadius: 12,
                  background: `${s.color}0d`,
                  border: `1px solid ${s.color}25`,
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: s.color, fontFamily: 'Outfit, sans-serif', lineHeight: 1 }}>
                    {pipelineCounts[s.key] || 0}
                  </div>
                  <div style={{ fontSize: '0.62rem', color: 'var(--rms-text-dim)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 3 }}>
                    {s.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* HR Tip */}
          <div className="rms-card" style={{
            background: 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(168,85,247,0.08))',
            borderColor: 'rgba(99,102,241,0.18)', padding: '22px 24px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>
                💡
              </div>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--rms-primary)', margin: 0 }}>HR Pro Tip</h3>
            </div>
            <p style={{ fontSize: '0.83rem', color: 'var(--rms-text-muted)', lineHeight: 1.6, margin: 0 }}>
              Shortlisted candidates are <strong style={{ color: '#fff' }}>3× more likely</strong> to accept an offer when interviewed within <strong style={{ color: '#fff' }}>48 hours</strong> of applying. Keep your pipeline moving!
            </p>
            <div style={{ marginTop: 16, display: 'flex', gap: 6 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--rms-primary)' }} />
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
