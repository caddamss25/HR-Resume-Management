const ROLE_CONFIG = {
  ADMIN:        { label: '🛡️ Admin',        cls: 'badge-admin' },
  HR_RECRUITER: { label: '👤 HR Recruiter', cls: 'badge-recruiter' }
}

export default function RoleBadge({ role }) {
  if (!role) return null
  const cfg = ROLE_CONFIG[role] || { label: role, cls: '' }
  return <span className={`rms-badge ${cfg.cls}`}>{cfg.label}</span>
}
