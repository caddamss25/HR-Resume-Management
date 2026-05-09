export default function SearchBar({ value, onChange, placeholder = 'Search...' }) {
  return (
    <div style={{ position: 'relative' }}>
      <i className="bi bi-search" style={{
        position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
        color: 'var(--rms-text-muted)', pointerEvents: 'none', zIndex: 1
      }} />
      <input
        id="global-search-bar"
        type="text"
        className="rms-input"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{ paddingLeft: 40 }}
      />
      {value && (
        <button
          onClick={() => onChange('')}
          style={{
            position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
            background: 'none', border: 'none', color: 'var(--rms-text-muted)',
            cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center'
          }}
          title="Clear"
        >
          <i className="bi bi-x-circle" />
        </button>
      )}
    </div>
  )
}
