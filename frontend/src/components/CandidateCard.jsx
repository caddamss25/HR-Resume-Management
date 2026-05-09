import { Link } from 'react-router-dom'
import RoleBadge from './RoleBadge'

export default function CandidateCard({ candidate, showResumes = false }) {
  return (
    <div className="rms-card h-100" style={{ transition: 'transform 0.2s' }}
      onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'}
      onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>

      {/* Avatar + Name */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
        <div style={{
          width: 44, height: 44, borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--rms-primary), var(--rms-secondary))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontWeight: 700, fontSize: '1rem', flexShrink: 0
        }}>
          {candidate.name?.[0]?.toUpperCase()}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{
            fontWeight: 700, fontSize: '0.95rem', color: 'var(--rms-text)',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
          }}>
            {candidate.name}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--rms-text-muted)' }}>
            {candidate.jobRole || 'No role'}
          </div>
        </div>
      </div>

      {/* Skills */}
      {candidate.skills?.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          {candidate.skills.slice(0, 4).map(s => (
            <span key={s} className="skill-tag">{s}</span>
          ))}
          {candidate.skills.length > 4 && (
            <span className="skill-tag">+{candidate.skills.length - 4}</span>
          )}
        </div>
      )}

      {/* Meta */}
      <div style={{ display: 'flex', gap: 16, fontSize: '0.8rem', color: 'var(--rms-text-muted)', marginBottom: 16 }}>
        {candidate.experienceYears != null && (
          <span><i className="bi bi-briefcase me-1" />{candidate.experienceYears}y exp</span>
        )}
        {candidate.email && (
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            <i className="bi bi-envelope me-1" />{candidate.email}
          </span>
        )}
      </div>

      {/* Status + Resume count */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
          <span className={`rms-badge badge-${candidate.status?.toLowerCase()}`} style={{ fontSize: '0.65rem' }}>
            {candidate.status}
          </span>
          {candidate.recruitmentStatus && (
            <span style={{ fontSize: '0.65rem', padding: '3px 8px', borderRadius: 999, background: 'var(--rms-surface-2)', border: '1px solid var(--rms-border)', fontWeight: 600, color: 'var(--rms-text)' }}>
              {candidate.recruitmentStatus.replace(/_/g, ' ')}
            </span>
          )}
        </div>
        {showResumes && candidate.resumes && (
          <div style={{ fontSize: '0.75rem', color: 'var(--rms-text-muted)' }}>
            <i className="bi bi-file-earmark me-1" />
            {candidate.resumes.length}
          </div>
        )}
      </div>

      {/* Summary Snippet */}
      {candidate.summary && (
        <div style={{ 
          fontSize: '0.8rem', color: 'var(--rms-text-muted)', marginBottom: 14,
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
          overflow: 'hidden', fontStyle: 'italic', lineHeight: 1.4
        }}>
          "{candidate.summary}"
        </div>
      )}

      {/* Action */}
      <Link to={`/candidates/${candidate.id}`}
        className="btn-rms-outline"
        style={{
          width: '100%', justifyContent: 'center', textDecoration: 'none',
          display: 'inline-flex', alignItems: 'center', gap: 8
        }}>
        <i className="bi bi-person-lines-fill" /> View Profile
      </Link>
    </div>
  )
}
