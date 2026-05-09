import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'
import { formatDate } from '../utils/formatDate'
import ResumeViewButton from '../components/ResumeViewButton'

const STAGES = [
  { key: 'APPLIED', label: 'Applied', color: '#4f8ef7', icon: 'bi-inbox' },
  { key: 'UNDER_REVIEW', label: 'Reviewing', color: '#f59e0b', icon: 'bi-eye' },
  { key: 'SHORTLISTED', label: 'Shortlisted', color: '#06d6a0', icon: 'bi-star' },
  { key: 'INTERVIEW_SCHEDULED', label: 'Interview', color: '#7c3aed', icon: 'bi-calendar-check' },
  { key: 'SELECTED', label: 'Hired', color: '#10b981', icon: 'bi-trophy' }
]

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
          api.get('/api/resumes/recent?count=5'),
          api.get('/api/resumes')
        ])
        setStats({ candidates: countRes.data.count, resumes: resumeCountRes.data.count })
        setRecent(recentRes.data)

        // Calculate pipeline funnel counts
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

  return (
    <div className="fade-in">
      {/* Welcome Header */}
      <div style={{ marginBottom: 40 }}>
        <h1 className="rms-page-title" style={{ fontSize: '2.25rem', letterSpacing: '-0.02em' }}>
          Good {getGreeting()}, <span className="text-gradient">{user?.name?.split(' ')[0]}</span> 👋
        </h1>
        <p className="rms-page-subtitle" style={{ fontSize: '1rem' }}>
          Here's a high-level overview of your recruitment metrics.
        </p>
      </div>

      {/* Stats Summary */}
      <div className="row g-4 mb-5">
        <div className="col-md-6 col-xl-3">
          <div className="rms-card" style={{ padding: '24px 28px', display: 'flex', alignItems: 'center', gap: 20 }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(99, 102, 241, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--rms-primary)', fontSize: '1.5rem' }}>
              <i className="bi bi-people-fill" />
            </div>
            <div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fff', lineHeight: 1.2, fontFamily: 'Outfit, sans-serif' }}>{stats.candidates}</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--rms-text-muted)', fontWeight: 600 }}>Active Candidates</div>
            </div>
          </div>
        </div>
        <div className="col-md-6 col-xl-3">
          <div className="rms-card" style={{ padding: '24px 28px', display: 'flex', alignItems: 'center', gap: 20 }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(168, 85, 247, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--rms-secondary)', fontSize: '1.5rem' }}>
              <i className="bi bi-file-earmark-text-fill" />
            </div>
            <div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fff', lineHeight: 1.2, fontFamily: 'Outfit, sans-serif' }}>{stats.resumes}</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--rms-text-muted)', fontWeight: 600 }}>Total Resumes</div>
            </div>
          </div>
        </div>
        <div className="col-md-6 col-xl-3">
          <div className="rms-card" style={{ padding: '24px 28px', display: 'flex', alignItems: 'center', gap: 20 }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(6, 214, 160, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--rms-accent)', fontSize: '1.5rem' }}>
              <i className="bi bi-star-fill" />
            </div>
            <div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fff', lineHeight: 1.2, fontFamily: 'Outfit, sans-serif' }}>{pipelineCounts['SHORTLISTED'] || 0}</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--rms-text-muted)', fontWeight: 600 }}>Shortlisted</div>
            </div>
          </div>
        </div>
        <div className="col-md-6 col-xl-3">
          <div className="rms-card" style={{ padding: '24px 28px', display: 'flex', alignItems: 'center', gap: 20 }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--rms-info)', fontSize: '1.5rem' }}>
              <i className="bi bi-briefcase-fill" />
            </div>
            <div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fff', lineHeight: 1.2, fontFamily: 'Outfit, sans-serif' }}>{pipelineCounts['INTERVIEW_SCHEDULED'] || 0}</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--rms-text-muted)', fontWeight: 600 }}>Interviews</div>
            </div>
          </div>
        </div>
      </div>

      {/* Hiring Pipeline Visualizer */}
      <div className="rms-card mb-5" style={{ padding: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40 }}>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
              <i className="bi bi-funnel-fill" style={{ color: 'var(--rms-primary)' }} />
              Recruitment Funnel
            </h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--rms-text-muted)', margin: 0 }}>Visual conversion tracker for all hiring stages</p>
          </div>
          <Link to="/pipeline" className="btn-rms" style={{ padding: '10px 20px', fontSize: '0.85rem' }}>
            Open Pipeline <i className="bi bi-arrow-right" />
          </Link>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          {STAGES.map((stage, i) => {
            const count = pipelineCounts[stage.key] || 0
            const total = stats.resumes || 1
            const width = Math.max((count / total) * 100, 5) // Min width for visibility
            
            return (
              <div key={stage.key} style={{ flex: width, minWidth: 60, transition: 'all 0.5s ease' }}>
                <div style={{ 
                  height: 12, background: stage.color, borderRadius: 6, marginBottom: 12,
                  boxShadow: `0 0 15px ${stage.color}44`, opacity: 0.9
                }} />
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff', fontFamily: 'Outfit, sans-serif' }}>{count}</div>
                  <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--rms-text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{stage.label}</div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Main Grid: Recent Activity & Quick Actions */}
      <div className="row g-4">
        <div className="col-lg-8">
          <div className="rms-card h-100">
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
              <i className="bi bi-lightning-charge-fill" style={{ color: 'var(--rms-warning)' }} />
              Recent Candidates
            </h2>
            
            {recent.length === 0 ? (
              <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--rms-text-dim)' }}>
                <i className="bi bi-inbox" style={{ fontSize: '3rem', display: 'block', marginBottom: 16, opacity: 0.2 }} />
                <p>No candidates processed yet</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="rms-table">
                  <thead>
                    <tr>
                      <th>Candidate Name</th>
                      <th>Stage</th>
                      <th>Processed On</th>
                      <th style={{ textAlign: 'right' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recent.map(r => (
                      <tr key={r.id} style={{ transition: 'background 0.2s' }}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--rms-surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.8rem', color: 'var(--rms-primary)' }}>
                              {(r.candidateName || r.fileName)[0].toUpperCase()}
                            </div>
                            <div style={{ fontWeight: 600, color: '#fff', fontSize: '0.9rem' }}>{r.candidateName || r.fileName.split('.')[0]}</div>
                          </div>
                        </td>
                        <td>
                          <span style={{ 
                            padding: '4px 10px', borderRadius: 999, fontSize: '0.7rem', fontWeight: 700,
                            background: 'rgba(255, 255, 255, 0.05)', color: 'var(--rms-text-muted)',
                            border: '1px solid var(--rms-border)'
                          }}>
                            {r.resumeStatus}
                          </span>
                        </td>
                        <td style={{ fontSize: '0.85rem', color: 'var(--rms-text-dim)' }}>{formatDate(r.uploadedAt)}</td>
                        <td style={{ textAlign: 'right' }}>
                          <ResumeViewButton resumeId={r.id} publicUrl={r.signedUrl} hasFile={!!r.signedUrl} 
                            style={{ padding: '6px 12px', fontSize: '0.75rem' }} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="col-lg-4">
          <div className="rms-card h-100" style={{ display: 'flex', flexDirection: 'column' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: 24 }}>Control Center</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <Link to="/upload" className="btn-rms" style={{ justifyContent: 'center', padding: '16px' }}>
                <i className="bi bi-cloud-arrow-up-fill" /> Bulk Upload Resumes
              </Link>
              <Link to="/candidates" className="btn-rms-outline" style={{ justifyContent: 'flex-start', padding: '14px 20px', borderRadius: 12 }}>
                <i className="bi bi-people-fill" style={{ color: 'var(--rms-primary)' }} />
                <span>Candidate Inventory</span>
              </Link>
              <Link to="/pipeline" className="btn-rms-outline" style={{ justifyContent: 'flex-start', padding: '14px 20px', borderRadius: 12 }}>
                <i className="bi bi-diagram-3-fill" style={{ color: 'var(--rms-secondary)' }} />
                <span>Hiring Pipeline</span>
              </Link>
              <Link to="/search" className="btn-rms-outline" style={{ justifyContent: 'flex-start', padding: '14px 20px', borderRadius: 12 }}>
                <i className="bi bi-cpu-fill" style={{ color: 'var(--rms-accent)' }} />
                <span>AI Resume Search</span>
              </Link>
            </div>

            <div style={{ 
              marginTop: 'auto', paddingTop: 24, borderTop: '1px solid var(--rms-border)', 
              display: 'flex', alignItems: 'center', gap: 14, color: 'var(--rms-text-dim)' 
            }}>
              <div style={{ position: 'relative' }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--rms-accent)', boxShadow: '0 0 10px var(--rms-accent)' }} />
                <div style={{ position: 'absolute', inset: -4, borderRadius: '50%', border: '2px solid var(--rms-accent)', animation: 'ping 1.5s infinite' }} />
              </div>
              <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Neon DB Production Active</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Morning'
  if (h < 17) return 'Afternoon'
  return 'Evening'
}

