import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchFeedback } from '../../store/adminSlice'
import Stars from '../../components/Stars'
import { Loading, Empty, ErrorBox } from '../../components/State'
import { fmtDateTime } from '../../utils/format'

export default function Feedback() {
  const dispatch = useDispatch()
  const { feedback, loading, error } = useSelector((s) => s.admin)
  const load = () => dispatch(fetchFeedback())
  useEffect(() => { load() }, [])
  const avg = feedback.length ? (feedback.reduce((a, f) => a + f.rating, 0) / feedback.length).toFixed(1) : null

  return (
    <>
      <div className="page-head">
        <div><h1>Customer feedback</h1><p className="muted">Ratings and comments left after completed journeys.</p></div>
        {avg && <div className="avg-box"><b>{avg}</b><Stars value={Math.round(avg)} size={18} /><small>{feedback.length} review(s)</small></div>}
      </div>
      <ErrorBox message={error} onRetry={load} />
      {loading && !feedback.length ? <Loading /> : !feedback.length ? (
        <Empty icon="⭐" title="No feedback yet" hint="Customers can rate a trip once the journey is completed." />
      ) : (
        <div className="card-grid">
          {feedback.map((f) => (
            <article key={f.id} className="panel feedback-card">
              <div className="fb-top"><Stars value={f.rating} size={20} /><small className="muted">{fmtDateTime(f.createdAt)}</small></div>
              <p className="fb-text">{f.comment ? `“${f.comment}”` : <span className="muted">No written comment</span>}</p>
              <div className="fb-meta"><b>{f.customerName}</b><span className="muted">{f.busName} · {f.route}</span><code className="code">{f.bookingCode}</code></div>
            </article>
          ))}
        </div>
      )}
    </>
  )
}
