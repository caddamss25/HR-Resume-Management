/**
 * ResumeViewButton
 * -----------------
 * Opens a resume using the permanent public Cloudinary URL.
 * No API call, no loading spinner — instant direct link.
 */
export default function ResumeViewButton({ resumeId, publicUrl, hasFile = true, label = 'View', style = {} }) {
  if (!hasFile || !publicUrl) {
    return (
      <span title="File not found in storage" style={{
        fontSize: '0.7rem', fontWeight: 600, padding: '3px 9px',
        borderRadius: 999, background: '#6b728022', color: '#9ca3af',
        display: 'inline-flex', alignItems: 'center', gap: 4,
        ...style
      }}>
        <i className="bi bi-exclamation-circle" style={{ fontSize: '0.7rem' }} />
        No file
      </span>
    )
  }

  return (
    <a
      href={publicUrl}
      target="_blank"
      rel="noreferrer"
      title="Open / Download resume"
      style={{
        color: 'var(--rms-primary)', textDecoration: 'none',
        display: 'inline-flex', alignItems: 'center', gap: 6,
        fontSize: '0.85rem', fontWeight: 600,
        ...style
      }}
    >
      <i className="bi bi-box-arrow-up-right" />
      {label && <span style={{ fontSize: '0.82rem' }}>{label}</span>}
    </a>
  )
}
