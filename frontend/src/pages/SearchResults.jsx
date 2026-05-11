import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import api from '../api/axios'
import SearchBar from '../components/SearchBar'
import CandidateCard from '../components/CandidateCard'
import { formatDate } from '../utils/formatDate'
import ResumeViewButton from '../components/ResumeViewButton'

// Options removed for dynamic input

const STATUS_COLORS = {
  APPLIED: '#4f8ef7',
  UNDER_REVIEW: '#f59e0b',
  SHORTLISTED: '#06d6a0',
  INTERVIEW_SCHEDULED: '#7c3aed',
  SELECTED: '#10b981',
  REJECTED: '#ef4444',
  ON_HOLD: '#6b7280'
}

export default function SearchResults() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [tab, setTab] = useState('candidates') // 'candidates' | 'resumes'

  // ── Candidate search state ──────────────────────────────
  const [filters, setFilters] = useState({
    keyword: searchParams.get('keyword') || '',
    skill: searchParams.get('skill') || '',
    role: searchParams.get('role') || '',
    minExp: searchParams.get('minExp') || '',
    status: searchParams.get('status') || ''
  })
  const [candidateResults, setCandidateResults] = useState([])
  const [candidateLoading, setCandidateLoading] = useState(false)
  const [candidateSearched, setCandidateSearched] = useState(false)
  const [availableRoles, setAvailableRoles] = useState([])

  // Fetch unique job roles dynamically from the database
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const { data } = await api.get('/api/search')
        const roles = Array.from(new Set(data.map(c => c.jobRole).filter(Boolean)))
        setAvailableRoles(roles.sort())
      } catch (err) {
        console.error('Failed to fetch distinct job roles:', err)
      }
    }
    fetchRoles()
  }, [])

  // ── Resume filename search state ────────────────────────
  const [fileNameQuery, setFileNameQuery] = useState('')
  const [resumeResults, setResumeResults] = useState([])
  const [resumeLoading, setResumeLoading] = useState(false)
  const [resumeSearched, setResumeSearched] = useState(false)

  // ── Candidate search ────────────────────────────────────
  const handleCandidateSearch = async (e) => {
    e?.preventDefault()
    setCandidateLoading(true)
    setCandidateSearched(true)
    const params = new URLSearchParams()
    if (filters.keyword) params.set('keyword', filters.keyword)
    if (filters.skill) params.set('skill', filters.skill)
    if (filters.role) params.set('role', filters.role)
    if (filters.minExp) params.set('minExp', filters.minExp)
    if (filters.status) params.set('status', filters.status)
    setSearchParams(params)
    try {
      const { data } = await api.get(`/api/search?${params.toString()}`)
      setCandidateResults(data)
    } catch (err) {
      console.error(err)
    } finally {
      setCandidateLoading(false)
    }
  }

  // ── Resume filename search ──────────────────────────────
  const handleResumeSearch = async (e) => {
    e?.preventDefault()
    setResumeLoading(true)
    setResumeSearched(true)
    try {
      const params = fileNameQuery.trim()
        ? `?fileName=${encodeURIComponent(fileNameQuery.trim())}`
        : ''
      const { data } = await api.get(`/api/resumes/search${params}`)
      setResumeResults(data)
    } catch (err) {
      console.error(err)
    } finally {
      setResumeLoading(false)
    }
  }

  // Auto-search if URL has candidate params
  useEffect(() => {
    if (searchParams.toString()) handleCandidateSearch()
  }, []) // eslint-disable-line

  const tabStyle = (active) => ({
    padding: '10px 28px',
    borderRadius: '8px 8px 0 0',
    border: 'none',
    fontWeight: 700,
    fontSize: '0.9rem',
    cursor: 'pointer',
    transition: 'all 0.2s',
    background: active ? 'var(--rms-surface)' : 'transparent',
    color: active ? 'var(--rms-primary)' : 'var(--rms-text-muted)',
    borderBottom: active ? '2px solid var(--rms-primary)' : '2px solid transparent',
  })

  return (
    <div className="fade-in">
      <h1 className="rms-page-title">Search</h1>
      <p className="rms-page-subtitle">Find candidates or search resumes by file name</p>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 0, borderBottom: '1px solid var(--rms-border)' }}>
        <button id="tab-candidates" style={tabStyle(tab === 'candidates')} onClick={() => setTab('candidates')}>
          <i className="bi bi-people me-2" />Candidates
        </button>
        <button id="tab-resumes" style={tabStyle(tab === 'resumes')} onClick={() => setTab('resumes')}>
          <i className="bi bi-file-earmark-text me-2" />Resumes by File Name
        </button>
      </div>

      {/* ── CANDIDATE SEARCH TAB ── */}
      {tab === 'candidates' && (
        <>
          <div className="rms-card mb-4" style={{ borderRadius: '0 8px 8px 8px' }}>
            <form onSubmit={handleCandidateSearch} id="search-form">
              <div className="row g-3">
                <div className="col-md-3">
                  <input id="keyword-filter" type="text" className="rms-input" placeholder="Keyword: name, email..."
                    value={filters.keyword} onChange={e => setFilters(p => ({ ...p, keyword: e.target.value }))} />
                </div>
                <div className="col-md-2">
                  <input id="skill-filter" type="text" className="rms-input" placeholder="Skill (e.g. React)"
                    value={filters.skill} onChange={e => setFilters(p => ({ ...p, skill: e.target.value }))} />
                </div>
                <div className="col-md-3">
                  <select
                    id="role-filter"
                    className="rms-input"
                    value={filters.role}
                    onChange={e => setFilters(p => ({ ...p, role: e.target.value }))}
                    style={{ appearance: 'auto', background: 'var(--rms-surface-2)', color: 'var(--rms-text)' }}
                  >
                    <option value="">Choose Role...</option>
                    {availableRoles.map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
                <div className="col-md-2">
                  <select
                    id="status-filter"
                    className="rms-input"
                    value={filters.status}
                    onChange={e => setFilters(p => ({ ...p, status: e.target.value }))}
                    style={{ appearance: 'auto', background: 'var(--rms-surface-2)', color: 'var(--rms-text)' }}
                  >
                    <option value="">Any Status</option>
                    {Object.keys(STATUS_COLORS).map(statusKey => (
                      <option key={statusKey} value={statusKey}>
                        {statusKey.replace(/_/g, ' ')}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-md-2">
                  <input id="exp-filter" type="number" className="rms-input" placeholder="Min Exp (Years)" min="0"
                    value={filters.minExp} onChange={e => setFilters(p => ({ ...p, minExp: e.target.value }))} />
                </div>
              </div>
              <div style={{ marginTop: 16, display: 'flex', gap: 12 }}>
                <button type="submit" id="search-submit" className="btn-rms" disabled={candidateLoading}>
                  {candidateLoading
                    ? <><span className="spinner-border spinner-border-sm me-2" />Searching...</>
                    : <><i className="bi bi-search" /> Search</>}
                </button>
                <button type="button" className="btn-rms-outline" onClick={() => {
                  setFilters({ keyword: '', skill: '', role: '', minExp: '', status: '' })
                  setSearchParams({})
                  setCandidateResults([])
                  setCandidateSearched(false)
                }}>
                  <i className="bi bi-x-circle" /> Clear
                </button>
              </div>
            </form>
          </div>

          {candidateLoading ? (
            <div className="rms-spinner"><div className="spinner-border text-primary" /></div>
          ) : candidateSearched ? (
            candidateResults.length === 0 ? (
              <div className="rms-empty">
                <i className="bi bi-search" />
                <p>No candidates match your search criteria</p>
              </div>
            ) : (
              <>
                <p style={{ color: 'var(--rms-text-muted)', fontSize: '0.88rem', marginBottom: 20 }}>
                  Found <strong style={{ color: 'var(--rms-text)' }}>{candidateResults.length}</strong> candidate(s)
                </p>
                <div className="row g-3">
                  {candidateResults.map(c => (
                    <div key={c.id} className="col-md-6 col-lg-4">
                      <CandidateCard candidate={c} showResumes />
                    </div>
                  ))}
                </div>
              </>
            )
          ) : (
            <div className="rms-empty">
              <i className="bi bi-funnel" />
              <p>Use the filters above to search for candidates</p>
            </div>
          )}
        </>
      )}

      {/* ── RESUME FILE NAME SEARCH TAB ── */}
      {tab === 'resumes' && (
        <>
          <div className="rms-card mb-4" style={{ borderRadius: '0 8px 8px 8px' }}>
            <form onSubmit={handleResumeSearch} id="resume-search-form">
              <div className="row g-3 align-items-end">
                <div className="col-md-8">
                  <label className="rms-label" htmlFor="filename-input">
                    Search by Resume File Name
                  </label>
                  <div style={{ position: 'relative' }}>
                    <i className="bi bi-search" style={{
                      position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
                      color: 'var(--rms-text-muted)', pointerEvents: 'none'
                    }} />
                    <input
                      id="filename-input"
                      type="text"
                      className="rms-input"
                      style={{ paddingLeft: 40 }}
                      placeholder="e.g. Subash, john_doe_resume, backend_dev..."
                      value={fileNameQuery}
                      onChange={e => setFileNameQuery(e.target.value)}
                    />
                  </div>
                </div>
                <div className="col-md-4" style={{ display: 'flex', gap: 10 }}>
                  <button type="submit" id="resume-search-submit" className="btn-rms" disabled={resumeLoading}>
                    {resumeLoading
                      ? <><span className="spinner-border spinner-border-sm me-2" />Searching...</>
                      : <><i className="bi bi-search" /> Search</>}
                  </button>
                  <button type="button" className="btn-rms-outline" onClick={() => {
                    setFileNameQuery('')
                    setResumeResults([])
                    setResumeSearched(false)
                  }}>
                    <i className="bi bi-x-circle" />
                  </button>
                </div>
              </div>
            </form>
          </div>

          {resumeLoading ? (
            <div className="rms-spinner"><div className="spinner-border text-primary" /></div>
          ) : resumeSearched ? (
            resumeResults.length === 0 ? (
              <div className="rms-empty">
                <i className="bi bi-file-earmark-x" />
                <p>No resumes found matching "<strong>{fileNameQuery}</strong>"</p>
              </div>
            ) : (
              <>
                <p style={{ color: 'var(--rms-text-muted)', fontSize: '0.88rem', marginBottom: 20 }}>
                  Found <strong style={{ color: 'var(--rms-text)' }}>{resumeResults.length}</strong> resume(s)
                  {fileNameQuery && <> matching "<strong style={{ color: 'var(--rms-text)' }}>{fileNameQuery}</strong>"</>}
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {resumeResults.map(r => (
                    <ResumeSearchCard key={r.id} resume={r} />
                  ))}
                </div>
              </>
            )
          ) : (
            <div className="rms-empty">
              <i className="bi bi-file-earmark-text" />
              <p>Enter a file name to search uploaded resumes</p>
              <p style={{ fontSize: '0.82rem', color: 'var(--rms-text-muted)', marginTop: 4 }}>
                Works for both candidate-linked and bulk-uploaded resumes
              </p>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function ResumeSearchCard({ resume }) {
  const statusColor = STATUS_COLORS[resume.resumeStatus] || '#6b7280'
  return (
    <div style={{
      background: 'var(--rms-surface)',
      border: '1px solid var(--rms-border)',
      borderRadius: 10,
      padding: '14px 18px',
      display: 'flex',
      alignItems: 'center',
      gap: 16,
      transition: 'border-color 0.2s',
    }}
      onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--rms-primary)'}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--rms-border)'}
    >
      <i className="bi bi-file-earmark-pdf" style={{ fontSize: '1.8rem', color: '#ef4444', flexShrink: 0 }} />

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: '0.95rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {resume.fileName}
        </div>
        <div style={{ display: 'flex', gap: 12, marginTop: 4, flexWrap: 'wrap', alignItems: 'center' }}>
          {resume.candidateName && (
            <span style={{ fontSize: '0.78rem', color: 'var(--rms-text-muted)' }}>
              <i className="bi bi-person me-1" />{resume.candidateName}
            </span>
          )}
          {!resume.candidateName && (
            <span style={{ fontSize: '0.78rem', color: 'var(--rms-text-muted)' }}>
              <i className="bi bi-inbox me-1" />Bulk uploaded (no candidate)
            </span>
          )}
          {resume.recruitedFor && (
            <span style={{ fontSize: '0.78rem', color: 'var(--rms-text-muted)' }}>
              <i className="bi bi-briefcase me-1" />{resume.recruitedFor}
            </span>
          )}
          <span style={{
            fontSize: '0.72rem', fontWeight: 700, padding: '1px 8px', borderRadius: 999,
            background: statusColor + '22', color: statusColor
          }}>
            {resume.resumeStatus?.replace('_', ' ')}
          </span>
          <span style={{ fontSize: '0.75rem', color: 'var(--rms-text-muted)' }}>
            {resume.uploadedAt ? new Date(resume.uploadedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : ''}
          </span>
        </div>
      </div>

      <ResumeViewButton
        resumeId={resume.id}
        publicUrl={resume.signedUrl}
        hasFile={!!resume.signedUrl}
        label="Open"
        style={{
          fontSize: '0.82rem', padding: '7px 14px', flexShrink: 0,
          background: 'var(--rms-primary)', color: '#fff', borderRadius: 8,
          border: 'none', cursor: 'pointer'
        }}
      />
    </div>
  )
}
