export function Loading({ text = 'Loading…' }) {
  return <div className="state"><div className="spinner" /><p>{text}</p></div>
}
export function Empty({ icon = '🗂️', title, hint, children }) {
  return (
    <div className="state">
      <div className="state-icon">{icon}</div>
      <h4>{title}</h4>
      {hint && <p>{hint}</p>}
      {children}
    </div>
  )
}
export function ErrorBox({ message, onRetry }) {
  if (!message) return null
  return (
    <div className="alert alert-error">
      <span>{message}</span>
      {onRetry && <button className="btn btn-sm btn-ghost" onClick={onRetry}>Retry</button>}
    </div>
  )
}
