/**
 * Format a date string or LocalDateTime into a readable format.
 * @param {string|Date} date
 * @returns {string}
 */
export function formatDate(date) {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric'
  })
}

/**
 * Format a date with time.
 * @param {string|Date} date
 * @returns {string}
 */
export function formatDateTime(date) {
  if (!date) return '—'
  return new Date(date).toLocaleString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}

/**
 * Relative time (e.g., "2 hours ago").
 * @param {string|Date} date
 * @returns {string}
 */
export function timeAgo(date) {
  if (!date) return '—'
  const seconds = Math.floor((Date.now() - new Date(date)) / 1000)
  const units = [
    { label: 'year',   secs: 31536000 },
    { label: 'month',  secs: 2592000 },
    { label: 'day',    secs: 86400 },
    { label: 'hour',   secs: 3600 },
    { label: 'minute', secs: 60 },
    { label: 'second', secs: 1 }
  ]
  for (const { label, secs } of units) {
    const n = Math.floor(seconds / secs)
    if (n >= 1) return `${n} ${label}${n > 1 ? 's' : ''} ago`
  }
  return 'just now'
}
