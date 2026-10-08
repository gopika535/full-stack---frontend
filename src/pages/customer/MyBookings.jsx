import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchMyBookings, submitFeedback, cancelBooking } from '../../store/bookingSlice'
import { showToast } from '../../store/uiSlice'
import Badge from '../../components/Badge'
import Modal from '../../components/Modal'
import Stars from '../../components/Stars'
import { Loading, Empty, ErrorBox } from '../../components/State'
import { downloadTicketPdf } from '../../utils/ticketPdf'
import { bookingState, fmtDateTime, money } from '../../utils/format'

export default function MyBookings() {
  const dispatch = useDispatch()
  const { mine, loading, error } = useSelector((s) => s.bookings)
  const [rating, setRating] = useState(null)   // booking being reviewed
  const [stars, setStars] = useState(0)
  const [comment, setComment] = useState('')
  const [saving, setSaving] = useState(false)

  const load = () => dispatch(fetchMyBookings())
  useEffect(() => { load() }, [])

  const openRate = (b) => { setRating(b); setStars(0); setComment('') }
  const send = async () => {
    if (!stars) return dispatch(showToast({ type: 'error', text: 'Please choose 1 to 5 stars' }))
    setSaving(true)
    const res = await dispatch(submitFeedback({ bookingId: rating.id, rating: stars, comment }))
    setSaving(false)
    if (submitFeedback.fulfilled.match(res)) {
      dispatch(showToast({ text: 'Thanks for your feedback!' }))
      setRating(null); load()
    } else dispatch(showToast({ type: 'error', text: res.payload }))
  }

  const [cancelling, setCancelling] = useState(null)
  const [cancelSeats, setCancelSeats] = useState([])
  const [cancelLoading, setCancelLoading] = useState(false)

  const openCancel = (b) => {
    setCancelling(b)
    setCancelSeats([...b.seats])
  }

  const handleTicketCountChange = (count) => {
    if (!cancelling) return
    setCancelSeats(cancelling.seats.slice(0, count))
  }

  const toggleCancelSeat = (seatNo) => {
    setCancelSeats((prev) => {
      if (prev.includes(seatNo)) {
        return prev.filter((s) => s !== seatNo)
      } else {
        return [...prev, seatNo].sort((a, b) => a - b)
      }
    })
  }

  const handleConfirmCancel = async () => {
    if (!cancelling) return
    if (!cancelSeats.length) {
      return dispatch(showToast({ type: 'error', text: 'Select at least one ticket to cancel' }))
    }
    setCancelLoading(true)
    const res = await dispatch(cancelBooking({
      bookingId: cancelling.id,
      seatNumbers: cancelSeats,
      ticketCount: cancelSeats.length,
    }))
    setCancelLoading(false)
    if (cancelBooking.fulfilled.match(res)) {
      dispatch(showToast({ text: `Cancelled ${cancelSeats.length} ticket(s) for ${cancelling.bookingCode}. Refund initiated.` }))
      setCancelling(null)
      load()
    } else {
      dispatch(showToast({ type: 'error', text: res.payload || 'Failed to cancel ticket' }))
    }
  }

  return (
    <>
      <div className="page-head"><div><h1>My bookings</h1><p className="muted">Download tickets, cancel bookings, and rate completed journeys.</p></div></div>
      <ErrorBox message={error} onRetry={load} />
      {loading && !mine.length ? <Loading /> : !mine.length ? (
        <Empty icon="🎫" title="No bookings yet" hint="Search a route and book your first seat." />
      ) : (
        <div className="stack">
          {mine.map((b) => {
            const st = bookingState(b)
            return (
              <article key={b.id} className={`panel booking-card ${b.status === 'CANCELLED' ? 'row-dim' : ''}`}>
                <div className="bc-main">
                  <div className="bc-top"><h3>{b.busName}</h3><Badge tone={st.tone}>{st.label}</Badge></div>
                  <div className="tile-route">{b.source} <i>→</i> {b.destination}</div>
                  <div className="bc-grid">
                    <span><small>Booking ID</small><code className="code">{b.bookingCode}</code></span>
                    <span>
                      <small>Departure</small>
                      {fmtDateTime(b.departureTime)}
                      {b.journeyReminderSent && (
                        <span style={{ fontSize: '0.72rem', color: '#b45309', fontWeight: 700, background: '#fef3c7', padding: '2px 6px', borderRadius: '4px', marginTop: '2px', display: 'inline-block' }}>
                          ⏰ Reminder sent
                        </span>
                      )}
                    </span>
                    <span><small>Seats</small>{b.seats.join(', ')}</span>
                    <span><small>Fare</small><b>{money(b.totalFare)}</b></span>
                  </div>
                  {b.passengers && b.passengers.length > 0 && (
                    <div style={{ marginTop: '0.6rem', fontSize: '0.85rem', background: '#f8fafd', padding: '0.5rem 0.8rem', borderRadius: '8px' }}>
                      <small className="muted" style={{ fontWeight: 700, display: 'block', marginBottom: '0.2rem' }}>PASSENGERS:</small>
                      {b.passengers.map((p, idx) => {
                        let g = p.gender || 'Female'
                        if (g === 'Prefer not to say') g = 'Female'
                        return (
                          <span key={idx} style={{ display: 'inline-block', marginRight: '1rem' }}>
                            <b>Seat {p.seatNumber}:</b> {p.name} ({g}, {p.passengerType}) {p.womenPreference ? '💖' : ''}
                          </span>
                        )
                      })}
                    </div>
                  )}
                  {b.medicalAssistance && (
                    <div style={{ marginTop: '0.6rem', fontSize: '0.85rem', background: '#fff1f2', border: '1px solid #fecdd3', color: '#be123c', padding: '0.45rem 0.8rem', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
                      <span>🚑</span>
                      <span>Special Assistance Requested: <strong>{b.medicalIssueDetails}</strong></span>
                    </div>
                  )}
                  {b.status === 'CANCELLED' && <p className="cancel-note">Ticket Cancelled. Amount will be refunded.</p>}
                  {b.feedbackGiven && <div className="bc-review"><Stars value={b.feedbackRating} size={18} /> {b.feedbackComment && <em>“{b.feedbackComment}”</em>}</div>}
                </div>
                <div className="bc-actions">
                  {b.status === 'CONFIRMED' && (
                    <>
                      <button className="btn btn-primary" onClick={() => downloadTicketPdf(b)}>⬇ Ticket PDF</button>
                      <button className="btn btn-danger btn-sm" onClick={() => openCancel(b)}>✕ Cancel Ticket</button>
                    </>
                  )}
                  {b.journeyCompleted && !b.feedbackGiven && <button className="btn btn-ghost" onClick={() => openRate(b)}>★ Rate journey</button>}
                </div>
              </article>
            )
          })}
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      {cancelling && (() => {
        const totalSeatsCount = cancelling.seats.length
        const unitFare = cancelling.totalFare / totalSeatsCount
        const refundAmount = unitFare * cancelSeats.length
        const remainingSeats = cancelling.seats.filter((s) => !cancelSeats.includes(s))

        return (
          <Modal
            title={`Cancel Ticket: ${cancelling.bookingCode}`}
            onClose={() => setCancelling(null)}
            footer={
              <>
                <button className="btn btn-ghost" onClick={() => setCancelling(null)} disabled={cancelLoading}>Keep Booking</button>
                <button
                  className="btn btn-danger"
                  onClick={handleConfirmCancel}
                  disabled={cancelLoading || cancelSeats.length === 0}
                >
                  {cancelLoading ? 'Cancelling…' : `Yes, Cancel ${cancelSeats.length} Ticket${cancelSeats.length > 1 ? 's' : ''}`}
                </button>
              </>
            }
          >
            <p style={{ marginBottom: '0.8rem' }}>
              Are you sure you want to cancel your ticket for <b>{cancelling.busName}</b>?
            </p>

            {totalSeatsCount > 1 && (
              <div style={{ background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: '12px', padding: '1rem', marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontWeight: 700, marginBottom: '0.4rem', color: 'var(--ink)' }}>
                  How many tickets would you like to cancel?
                </label>
                <select
                  className="input"
                  value={cancelSeats.length}
                  onChange={(e) => handleTicketCountChange(Number(e.target.value))}
                  style={{ marginBottom: '0.8rem', width: '100%' }}
                >
                  {Array.from({ length: totalSeatsCount }, (_, i) => i + 1).map((cnt) => (
                    <option key={cnt} value={cnt}>
                      {cnt === totalSeatsCount ? `All (${cnt} tickets)` : `${cnt} ticket${cnt > 1 ? 's' : ''}`}
                    </option>
                  ))}
                </select>

                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--muted)', marginBottom: '0.4rem' }}>
                  Select specific ticket(s) to cancel:
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  {cancelling.seats.map((seatNo) => {
                    const pass = cancelling.passengers?.find((p) => p.seatNumber === seatNo)
                    const isChecked = cancelSeats.includes(seatNo)
                    return (
                      <label
                        key={seatNo}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '0.5rem 0.8rem',
                          borderRadius: '8px',
                          border: isChecked ? '1.5px solid #ef4444' : '1px solid #cbd5e1',
                          background: isChecked ? '#fef2f2' : '#ffffff',
                          cursor: 'pointer',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleCancelSeat(seatNo)}
                          />
                          <b>Seat {seatNo}</b>
                          {pass && <span className="muted" style={{ fontSize: '0.85rem' }}>({pass.name})</span>}
                        </div>
                        <span style={{ fontWeight: 700, color: isChecked ? '#b91c1c' : 'var(--muted)' }}>
                          {money(unitFare)}
                        </span>
                      </label>
                    )
                  })}
                </div>
              </div>
            )}

            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', padding: '0.8rem', borderRadius: '10px' }}>
              <p style={{ margin: 0, color: '#991b1b', fontSize: '0.9rem' }}>
                ⚠️ <b>{cancelSeats.length} ticket(s) (Seat {cancelSeats.join(', ') || 'None'})</b> will be cancelled and immediately released for other passengers.
                A refund of <b>{money(refundAmount)}</b> will be processed.
                {remainingSeats.length > 0 && (
                  <span style={{ display: 'block', marginTop: '0.4rem', color: '#047857' }}>
                    ✓ Remaining active tickets: <b>Seats {remainingSeats.join(', ')}</b>.
                  </span>
                )}
              </p>
            </div>
          </Modal>
        )
      })()}

      {rating && (
        <Modal title={`Rate ${rating.busName}`} onClose={() => setRating(null)}
          footer={<><button className="btn btn-ghost" onClick={() => setRating(null)}>Cancel</button><button className="btn btn-primary" onClick={send} disabled={saving}>{saving ? 'Sending…' : 'Submit feedback'}</button></>}>
          <p className="muted">{rating.source} → {rating.destination} · {fmtDateTime(rating.departureTime)}</p>
          <div className="rate-box"><Stars value={stars} onChange={setStars} size={38} /></div>
          <label className="form"><span className="lbl">Your feedback (optional)</span>
            <textarea rows="4" maxLength={1000} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="How was the journey?" />
          </label>
        </Modal>
      )}
    </>
  )
}
