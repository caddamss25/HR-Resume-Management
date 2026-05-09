import { useAuth } from '../context/AuthContext'
import { formatDate } from '../utils/formatDate'
import ResumeViewButton from './ResumeViewButton'

const STATUS_COLORS = {
  APPLIED:             '#4f8ef7',
  UNDER_REVIEW:        '#f59e0b',
  SHORTLISTED:         '#06d6a0',
  INTERVIEW_SCHEDULED: '#7c3aed',
  SELECTED:            '#10b981',
  REJECTED:            '#ef4444',
  ON_HOLD:             '#6b7280'
}

const STATUS_LABELS = {
  APPLIED:             'Applied',
  UNDER_REVIEW:        'Under Review',
  SHORTLISTED:         'Shortlisted',
  INTERVIEW_SCHEDULED: 'Interview Scheduled',
  SELECTED:            'Selected',
  REJECTED:            'Rejected',
  ON_HOLD:             'On Hold'
}

export default function ResumeCard({ resume, onDelete, onStatusChange }) {
  const { user } = useAuth()
  const color = STATUS_COLORS[resume.resumeStatus] || '#888'

  return (
    <div style={{
      background: 'var(--rms-surface-2)', border: '1px solid var(--rms-border)',
      borderRadius: 'var(--rms-radius-sm)', padding: '14px 16px',
      transition: 'border-color 0.2s, box-shadow 0.2s'
    }}
    onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--rms-primary)' }}
    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--rms-border)' }}>

      {/* Top row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
        <i className="bi bi-file-earmark-pdf-fill" style={{ fontSize: '1.4rem', color: '#ef4444', flexShrink: 0, marginTop: 2 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: '0.88rem', overflow: 'hidden',
            textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 4 }}>
            {resume.fileName}
          </div>

          {/* Status Badge */}
          <span style={{
            display: 'inline-block', padding: '2px 10px', borderRadius: 999,
            fontSize: '0.72rem', fontWeight: 700,
            background: color + '22', color: color, marginRight: 6
          }}>
            {STATUS_LABELS[resume.resumeStatus] || resume.resumeStatus}
          </span>

          {/* Recruited For */}
          {resume.recruitedFor && (
            <span style={{ fontSize: '0.72rem', color: 'var(--rms-text-muted)', fontStyle: 'italic' }}>
              for {resume.recruitedFor}
            </span>
          )}
        </div>
      </div>

      {/* Meta row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        <span style={{ fontSize: '0.75rem', color: 'var(--rms-text-muted)' }}>
          <i className="bi bi-calendar3 me-1" />
          {formatDate(resume.uploadedAt)}
          {resume.uploadedByName && <> · by {resume.uploadedByName}</>}
        </span>

        <div style={{ display: 'flex', gap: 8 }}>
          {/* Change Status */}
          {onStatusChange && (
            <select
              defaultValue={resume.resumeStatus}
              onChange={e => onStatusChange(resume.id, e.target.value)}
              onClick={e => e.stopPropagation()}
              style={{
                background: 'var(--rms-surface)', border: '1px solid var(--rms-border)',
                color: 'var(--rms-text)', borderRadius: 6, padding: '4px 8px',
                fontSize: '0.75rem', cursor: 'pointer'
              }}>
              {Object.entries(STATUS_LABELS).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          )}

          <ResumeViewButton
            resumeId={resume.id}
            publicUrl={resume.signedUrl}
            hasFile={!!resume.signedUrl}
            label="Download"
            style={{
              background: 'rgba(79,142,247,0.12)', color: 'var(--rms-primary)',
              border: '1px solid rgba(79,142,247,0.25)', borderRadius: 6,
              padding: '5px 10px', fontSize: '0.82rem'
            }}
          />

          {/* Delete — shows for both roles */}
          {onDelete && (
            <button id={`delete-resume-${resume.id}`} onClick={() => onDelete(resume.id)}
              title="Delete"
              style={{
                background: 'rgba(239,68,68,0.1)', color: 'var(--rms-danger)',
                border: '1px solid rgba(239,68,68,0.2)', borderRadius: 6,
                padding: '5px 10px', cursor: 'pointer', fontSize: '0.82rem',
                display: 'inline-flex', alignItems: 'center'
              }}>
              <i className="bi bi-trash" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
