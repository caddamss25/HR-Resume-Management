import { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'

const ACCEPTED = {
  'application/pdf': ['.pdf'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
}

export default function FileUpload({ file, onFileChange }) {
  const onDrop = useCallback((accepted) => {
    if (accepted.length > 0) onFileChange(accepted[0])
  }, [onFileChange])

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept: ACCEPTED,
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024 // 10MB
  })

  return (
    <div>
      <div {...getRootProps()} className={`rms-dropzone ${isDragActive ? 'active' : ''}`}
        id="file-dropzone">
        <input {...getInputProps()} id="file-input" />
        <i className="bi bi-cloud-arrow-up" />
        {isDragActive ? (
          <p style={{ fontWeight: 600 }}>Drop the file here...</p>
        ) : (
          <>
            <p style={{ fontWeight: 600, marginBottom: 4 }}>
              Drag & drop or <span style={{ color: 'var(--rms-primary)' }}>click to browse</span>
            </p>
            <p style={{ fontSize: '0.8rem', margin: 0 }}>PDF, DOC, DOCX — Max 10MB</p>
          </>
        )}
      </div>

      {/* Selected file preview */}
      {file && (
        <div style={{
          marginTop: 12, padding: '12px 16px',
          background: 'rgba(79,142,247,0.08)',
          border: '1px solid rgba(79,142,247,0.25)',
          borderRadius: 'var(--rms-radius-sm)',
          display: 'flex', alignItems: 'center', gap: 12
        }}>
          <i className="bi bi-file-earmark-check-fill" style={{ color: 'var(--rms-primary)', fontSize: '1.2rem' }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 600, fontSize: '0.88rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {file.name}
            </div>
            <div style={{ fontSize: '0.76rem', color: 'var(--rms-text-muted)' }}>
              {(file.size / 1024).toFixed(1)} KB
            </div>
          </div>
          <button
            type="button"
            onClick={() => onFileChange(null)}
            style={{ background: 'none', border: 'none', color: 'var(--rms-text-muted)', cursor: 'pointer' }}
          >
            <i className="bi bi-x-lg" />
          </button>
        </div>
      )}

      {fileRejections.length > 0 && (
        <p style={{ color: 'var(--rms-danger)', fontSize: '0.82rem', marginTop: 8 }}>
          <i className="bi bi-exclamation-circle me-1" />
          {fileRejections[0].errors[0]?.message}
        </p>
      )}
    </div>
  )
}
