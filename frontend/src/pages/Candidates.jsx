import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/axios'
import CandidateCard from '../components/CandidateCard'
import SearchBar from '../components/SearchBar'
import { useSearch } from '../hooks/useSearch'

export default function Candidates() {
  const [candidates, setCandidates] = useState([])
  const [loading, setLoading]       = useState(true)
  const [page, setPage]             = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const { query, setQuery } = useSearch()

  const fetchCandidates = useCallback(async (p = 0) => {
    setLoading(true)
    try {
      const res = await api.get(`/api/candidates?page=${p}&size=12`)
      setCandidates(res.data.content)
      setTotalPages(res.data.totalPages)
      setPage(p)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchCandidates(0) }, [fetchCandidates])

  // Client-side filter by query
  const filtered = query
    ? candidates.filter(c =>
        c.name?.toLowerCase().includes(query.toLowerCase()) ||
        c.email?.toLowerCase().includes(query.toLowerCase()) ||
        c.jobRole?.toLowerCase().includes(query.toLowerCase()) ||
        c.skills?.some(s => s.toLowerCase().includes(query.toLowerCase()))
      )
    : candidates

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 className="rms-page-title">Candidates</h1>
          <p className="rms-page-subtitle">Browse and manage all candidate profiles</p>
        </div>
        <Link to="/upload" className="btn-rms">
          <i className="bi bi-upload" /> Upload Resume
        </Link>
      </div>

      {/* Search */}
      <div className="mb-4">
        <SearchBar
          value={query}
          onChange={setQuery}
          placeholder="Search by name, skill, or role..."
        />
      </div>

      {loading ? (
        <div className="rms-spinner"><div className="spinner-border text-primary" /></div>
      ) : filtered.length === 0 ? (
        <div className="rms-empty">
          <i className="bi bi-person-x" />
          <p>No candidates found</p>
        </div>
      ) : (
        <>
          <div className="row g-3 mb-4">
            {filtered.map(c => (
              <div key={c.id} className="col-md-6 col-lg-4">
                <CandidateCard candidate={c} />
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
              <button className="btn-rms-outline" onClick={() => fetchCandidates(page - 1)} disabled={page === 0}>
                <i className="bi bi-chevron-left" /> Prev
              </button>
              <span style={{ alignSelf: 'center', color: 'var(--rms-text-muted)', fontSize: '0.9rem' }}>
                Page {page + 1} of {totalPages}
              </span>
              <button className="btn-rms-outline" onClick={() => fetchCandidates(page + 1)} disabled={page >= totalPages - 1}>
                Next <i className="bi bi-chevron-right" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
