export const money = (n) => '₹' + Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })

const d = (v) => (v ? new Date(v) : null)

export const fmtDate = (v) =>
  d(v)?.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) || '-'

export const fmtTime = (v) =>
  d(v)?.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) || '-'

export const fmtDateTime = (v) => (v ? `${fmtDate(v)}, ${fmtTime(v)}` : '-')

export const fmtDuration = (mins) => {
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return `${h}h ${m.toString().padStart(2, '0')}m`
}

// value for <input type="datetime-local">
export const toInputDateTime = (v) => (v ? String(v).slice(0, 16) : '')

export const todayISO = () => {
  const t = new Date()
  t.setMinutes(t.getMinutes() - t.getTimezoneOffset())
  return t.toISOString().slice(0, 10)
}

export const bookingState = (b) => {
  if (b.status === 'CANCELLED') return { label: 'Cancelled', tone: 'red' }
  if (b.journeyCompleted) return { label: 'Completed', tone: 'gray' }
  return { label: 'Confirmed', tone: 'green' }
}
