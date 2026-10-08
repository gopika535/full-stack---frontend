import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { createBooking, clearConfirmed, setDraft, cancelBooking } from '../../store/bookingSlice'
import { showToast } from '../../store/uiSlice'
import Modal from '../../components/Modal'
import { downloadTicketPdf } from '../../utils/ticketPdf'
import { fmtDate, fmtDateTime, fmtDuration, money } from '../../utils/format'

const TABS = [['UPI', '📱 UPI'], ['CARD', '💳 Credit / Debit Card'], ['NET', '🏦 Net Banking']]
const UPI_APPS = [
  { name: 'Google Pay', handle: '@okaxis', icon: '🟢' },
  { name: 'PhonePe', handle: '@ybl', icon: '🟣' },
  { name: 'Paytm', handle: '@paytm', icon: '🔵' },
  { name: 'BHIM UPI', handle: '@upi', icon: '🟠' },
]
const BANKS = [
  'Indian Bank',
  'Karur Vysya Bank (KVB)',
  'State Bank of India (SBI)',
  'Canara Bank',
  'Indian Overseas Bank (IOB)',
  'HDFC Bank',
  'ICICI Bank',
  'Axis Bank',
]

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

function getCardBrand(number = '') {
  const clean = number.replace(/\s/g, '')
  if (clean.startsWith('4')) return { name: 'Visa', icon: '💳 Visa' }
  if (/^5[1-5]/.test(clean)) return { name: 'Mastercard', icon: '💳 Mastercard' }
  if (/^60|^65|^81|^82/.test(clean)) return { name: 'RuPay', icon: '💳 RuPay' }
  if (/^3[47]/.test(clean)) return { name: 'Amex', icon: '💳 Amex' }
  return { name: 'Card', icon: '💳 Card' }
}

function validate(method, f) {
  if (method === 'UPI') {
    if (!f.upi.trim() || !/^[\w.\-]{2,}@[a-zA-Z]{2,}$/.test(f.upi.trim())) {
      return 'Please enter a valid UPI ID (e.g., name@okaxis or 9876543210@paytm)'
    }
  }
  if (method === 'CARD') {
    const cleanNum = f.cardNumber.replace(/\s/g, '')
    if (cleanNum.length !== 16) return 'Please enter a valid 16-digit card number'
    if (f.cardName.trim().length < 3) return 'Please enter the card holder name'
    if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(f.expiry)) return 'Please enter valid expiry date (MM/YY)'
    if (!/^\d{3}$/.test(f.cvv)) return 'Please enter 3-digit CVV number'
  }
  if (method === 'NET') {
    if (!f.bank) return 'Please select your bank'
    if (!f.netUser.trim()) return 'Please enter your Net Banking User ID'
    if (f.netPass.length < 4) return 'Please enter your Net Banking Password'
  }
  return ''
}

export default function Checkout() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const user = useSelector((s) => s.auth.user)
  const { draft, confirmed } = useSelector((s) => s.bookings)
  const [cancellingConfirmed, setCancellingConfirmed] = useState(false)
  const [cancelModalOpen, setCancelModalOpen] = useState(false)
  const [cancelSeats, setCancelSeats] = useState([])

  const [method, setMethod] = useState('UPI')
  const [f, setF] = useState({
    upi: '',
    cardNumber: '',
    cardName: '',
    expiry: '',
    cvv: '',
    bank: 'Indian Bank',
    netUser: '',
    netPass: '',
    otp: '',
  })
  const [payError, setPayError] = useState('')
  const [asking, setAsking] = useState(false)
  const [otpModal, setOtpModal] = useState(false)
  const [stage, setStage] = useState(null) // null | 'verifying' | 'authorizing' | 'paid'
  const [txnId, setTxnId] = useState('')

  const set = (k, v) => {
    setPayError('')
    setF((p) => ({ ...p, [k]: v }))
  }

  const openCancelModal = () => {
    if (!confirmed) return
    setCancelSeats([...confirmed.seats])
    setCancelModalOpen(true)
  }

  const handleTicketCountChange = (count) => {
    if (!confirmed) return
    setCancelSeats(confirmed.seats.slice(0, count))
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
    if (!confirmed || !cancelSeats.length) return
    setCancellingConfirmed(true)
    const res = await dispatch(cancelBooking({
      bookingId: confirmed.id,
      seatNumbers: cancelSeats,
      ticketCount: cancelSeats.length,
    }))
    setCancellingConfirmed(false)
    if (cancelBooking.fulfilled.match(res)) {
      dispatch(showToast({ text: `Cancelled ${cancelSeats.length} ticket(s). Refund initiated.` }))
      setCancelModalOpen(false)
      dispatch(clearConfirmed())
      navigate('/customer/bookings')
    } else {
      dispatch(showToast({ type: 'error', text: res.payload || 'Failed to cancel ticket' }))
    }
  }

  // ---------- Success Screen ----------
  if (confirmed) {
    return (
      <div className="success-wrap">
        <div className="success-card">
          <div className="success-tick">✓</div>
          <h1>Ticket Booked Successfully!</h1>
          <p className="muted">Payment received via {confirmed.paidVia || 'Demo Payment'}. Your seats are confirmed.</p>

          <div className="booking-id">
            <small>Booking Reference ID</small>
            <b>{confirmed.bookingCode}</b>
          </div>

          <dl className="sum-list">
            <div><dt>Bus</dt><dd><b>{confirmed.busName}</b></dd></div>
            <div><dt>Route</dt><dd>{confirmed.source} → {confirmed.destination}</dd></div>
            <div><dt>Departure</dt><dd>{fmtDateTime(confirmed.departureTime)}</dd></div>
            <div><dt>Seats</dt><dd><b>{confirmed.seats.join(', ')}</b></dd></div>

            {confirmed.passengers && confirmed.passengers.length > 0 && (
              <div style={{ margin: '0.8rem 0', textAlign: 'left', background: '#f8fafd', padding: '0.8rem 1rem', borderRadius: '12px' }}>
                <b style={{ display: 'block', marginBottom: '0.4rem', color: 'var(--ink)' }}>Passengers:</b>
                {confirmed.passengers.map((p, idx) => (
                  <div key={idx} style={{ fontSize: '0.88rem', padding: '0.2rem 0', borderBottom: idx < confirmed.passengers.length - 1 ? '1px dashed #e1e8f1' : 'none' }}>
                    <b>Seat {p.seatNumber}:</b> {p.name} ({p.gender || 'Female'}, {p.passengerType}) {p.womenPreference ? '💖' : ''}
                  </div>
                ))}
              </div>
            )}

            {confirmed.pickupPoint && (
              <div>
                <dt>Pick-up Point</dt>
                <dd><b>📍 {confirmed.pickupPoint.name}</b> <small>({confirmed.pickupPoint.time})</small></dd>
              </div>
            )}
            {confirmed.dropPoint && (
              <div>
                <dt>Dropping Point</dt>
                <dd><b>🚩 {confirmed.dropPoint.name}</b> <small>({confirmed.dropPoint.time})</small></dd>
              </div>
            )}

            {confirmed.medicalAssistance && (
              <div style={{ margin: '0.6rem 0', background: '#fff7ed', border: '1px solid #fed7aa', padding: '0.6rem 0.8rem', borderRadius: '10px', textAlign: 'left' }}>
                <b style={{ color: '#9a3412', display: 'block', fontSize: '0.88rem' }}>🚑 Medical Assistance Requested:</b>
                <span style={{ fontSize: '0.85rem', color: '#c2410c' }}>{confirmed.medicalIssueDetails}</span>
              </div>
            )}

            <div><dt>Total Amount Paid</dt><dd><b>{money(confirmed.totalFare)}</b></dd></div>
            {confirmed.paidVia && <div><dt>Paid via</dt><dd>{confirmed.paidVia}</dd></div>}
          </dl>

          <div className="modal-actions center-actions">
            <button className="btn btn-primary" onClick={() => downloadTicketPdf(confirmed)}>
              ⬇ Download Ticket (PDF)
            </button>
            <button
              className="btn btn-danger"
              onClick={openCancelModal}
              disabled={cancellingConfirmed}
            >
              {cancellingConfirmed ? 'Cancelling…' : '✕ Cancel Ticket'}
            </button>
            <button
              className="btn btn-ghost"
              onClick={() => {
                dispatch(clearConfirmed())
                navigate('/customer/bookings')
              }}
            >
              View My Bookings
            </button>
          </div>

          {cancelModalOpen && (() => {
            const totalSeatsCount = confirmed.seats.length
            const unitFare = confirmed.totalFare / totalSeatsCount
            const refundAmount = unitFare * cancelSeats.length
            const remainingSeats = confirmed.seats.filter((s) => !cancelSeats.includes(s))

            return (
              <Modal
                title={`Cancel Ticket: ${confirmed.bookingCode}`}
                onClose={() => setCancelModalOpen(false)}
                footer={
                  <>
                    <button className="btn btn-ghost" onClick={() => setCancelModalOpen(false)} disabled={cancellingConfirmed}>Keep Booking</button>
                    <button
                      className="btn btn-danger"
                      onClick={handleConfirmCancel}
                      disabled={cancellingConfirmed || cancelSeats.length === 0}
                    >
                      {cancellingConfirmed ? 'Cancelling…' : `Yes, Cancel ${cancelSeats.length} Ticket${cancelSeats.length > 1 ? 's' : ''}`}
                    </button>
                  </>
                }
              >
                <p style={{ marginBottom: '0.8rem' }}>
                  Are you sure you want to cancel your ticket for <b>{confirmed.busName}</b>?
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
                      {confirmed.seats.map((seatNo) => {
                        const pass = confirmed.passengers?.find((p) => p.seatNumber === seatNo)
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
        </div>
      </div>
    )
  }

  if (!draft) return <Navigate to="/customer" replace />
  const { bus, seats, passengers, pickupPoint, dropPoint, medicalAssistance, medicalIssueDetails } = draft
  const total = bus.fare * seats.length

  const payLabel = () => {
    if (method === 'UPI') return `UPI (${f.upi.trim()})`
    if (method === 'CARD') return `${getCardBrand(f.cardNumber).name} ending ${f.cardNumber.replace(/\s/g, '').slice(-4)}`
    return `${f.bank} Net Banking`
  }

  const handleProceedToPay = () => {
    const err = validate(method, f)
    if (err) return setPayError(err)
    
    if (method === 'CARD') {
      setOtpModal(true) // Show 3D Secure OTP Modal for Card
    } else {
      setAsking(true)   // Show confirmation dialog for UPI and Net Banking
    }
  }

  const executePayment = async () => {
    setAsking(false)
    setOtpModal(false)

    const generatedTxn = 'TXN' + Math.floor(100000000 + Math.random() * 900000000)
    setTxnId(generatedTxn)
    setStage('verifying')

    // Simulate realistic payment gateway processing stages
    await sleep(1400)
    setStage('authorizing')
    await sleep(1500)

    const label = payLabel()
    dispatch(setDraft({ paidVia: label }))

    const res = await dispatch(createBooking({
      busId: bus.id,
      seatNumbers: seats,
      passengers,
      medicalAssistance: !!medicalAssistance,
      medicalIssueDetails: medicalIssueDetails || null,
    }))

    if (createBooking.fulfilled.match(res)) {
      setStage('paid')
      await sleep(1000)
      setStage(null)
    } else {
      setStage(null)
      if (res.payload && typeof res.payload === 'string' && (res.payload.toLowerCase().includes('female only') || res.payload.toLowerCase().includes('womens only') || res.payload.toLowerCase().includes('women only'))) {
        window.alert('warning: prefered for womens only')
      }
      dispatch(showToast({ type: 'error', text: res.payload }))
      navigate(`/customer/bus/${bus.id}`)
    }
  }

  const processingMessage = {
    UPI: `Sending payment request to ${f.upi.trim()}... Please approve in your UPI App`,
    CARD: `Verifying 3D Secure OTP with ${getCardBrand(f.cardNumber).name} Gateway...`,
    NET: `Authenticating Net Banking credentials with ${f.bank}...`,
  }[method]

  return (
    <>
      <Link to={`/customer/bus/${bus.id}`} className="back">← Back to Seat Selection</Link>
      
      <div className="page-head">
        <div>
          <h1>Confirm &amp; Pay</h1>
          <p className="muted">Review your trip summary and select your payment method.</p>
        </div>
      </div>

      <div className="two-col">
        <div className="stack">
          {/* Passenger Details */}
          <section className="panel">
            <div className="panel-head">
              <h3>Passenger Information</h3>
            </div>
            {passengers && passengers.length > 0 ? (
              <div className="stack" style={{ gap: '0.6rem' }}>
                {passengers.map((p, i) => (
                  <div key={i} className="passenger-card" style={{ padding: '0.75rem 1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <b>💺 Seat {p.seatNumber} — {p.name}</b>
                      {p.womenPreference && <span className="women-badge">💖 Women Preference</span>}
                    </div>
                    <small className="muted">Gender: <b>{p.gender}</b> | Type: <b>{p.passengerType}</b></small>
                  </div>
                ))}
              </div>
            ) : (
              <div className="form">
                <label>Name<input value={user.name} readOnly /></label>
                <label>Email<input value={user.email} readOnly /></label>
                <label>Mobile Number<input value={user.mobile || ''} readOnly /></label>
              </div>
            )}
            {medicalAssistance && (
              <div style={{ marginTop: '0.8rem', background: '#fff7ed', border: '1.5px solid #fed7aa', padding: '0.75rem 1rem', borderRadius: '12px' }}>
                <b style={{ color: '#9a3412', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.9rem' }}>
                  🚑 Medical / Special Assistance Requested
                </b>
                <p style={{ margin: '0.3rem 0 0', color: '#c2410c', fontSize: '0.85rem' }}>
                  {medicalIssueDetails}
                </p>
              </div>
            )}
          </section>

          {/* Payment Method Section */}
          <section className="panel">
            <div className="panel-head">
              <h3>Select Payment Method</h3>
              <span className="secure-tag">🔒 256-Bit SSL Demo Gateway</span>
            </div>

            <div className="pay-tabs" role="tablist">
              {TABS.map(([k, label]) => (
                <button
                  key={k}
                  type="button"
                  role="tab"
                  aria-selected={method === k}
                  className={`pay-tab ${method === k ? 'on' : ''}`}
                  onClick={() => {
                    setMethod(k)
                    setPayError('')
                  }}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* UPI DEMO */}
            {method === 'UPI' && (
              <div className="form pay-panel">
                <span className="lbl">Quick Select App or Enter UPI ID</span>
                <div className="upi-apps-grid">
                  {UPI_APPS.map((app) => (
                    <button
                      key={app.name}
                      type="button"
                      className="upi-app-btn"
                      onClick={() => set('upi', `${(user.name || 'user').toLowerCase().replace(/\s+/g, '')}${app.handle}`)}
                    >
                      <span className="upi-icon">{app.icon}</span>
                      <span>{app.name}</span>
                    </button>
                  ))}
                </div>

                <label style={{ marginTop: '0.8rem' }}>
                  UPI ID (VPA)
                  <input
                    value={f.upi}
                    onChange={(e) => set('upi', e.target.value)}
                    placeholder="e.g. name@okaxis or 9876543210@paytm"
                    autoComplete="off"
                  />
                </label>
                <small className="muted">
                  A payment request of <b>{money(total)}</b> will be sent to this UPI ID. Open Google Pay, PhonePe, or Paytm to approve.
                </small>
              </div>
            )}

            {/* CARD DEMO */}
            {method === 'CARD' && (
              <div className="form pay-panel">
                <div className="card-brand-tag">
                  <span>{getCardBrand(f.cardNumber).icon}</span>
                </div>
                <label>
                  Card Number
                  <input
                    inputMode="numeric"
                    value={f.cardNumber}
                    placeholder="4532 1234 5678 9012"
                    autoComplete="off"
                    onChange={(e) =>
                      set(
                        'cardNumber',
                        e.target.value
                          .replace(/\D/g, '')
                          .slice(0, 16)
                          .replace(/(\d{4})(?=\d)/g, '$1 ')
                          .trim()
                      )
                    }
                  />
                </label>
                <label>
                  Card Holder Name
                  <input
                    value={f.cardName}
                    onChange={(e) => set('cardName', e.target.value.toUpperCase())}
                    placeholder="NAME AS PRINTED ON CARD"
                    autoComplete="off"
                  />
                </label>
                <div className="grid-2">
                  <label>
                    Expiry Date (MM/YY)
                    <input
                      inputMode="numeric"
                      value={f.expiry}
                      placeholder="08/29"
                      autoComplete="off"
                      onChange={(e) => {
                        let v = e.target.value.replace(/\D/g, '').slice(0, 4)
                        if (v.length > 2) v = v.slice(0, 2) + '/' + v.slice(2)
                        set('expiry', v)
                      }}
                    />
                  </label>
                  <label>
                    CVV
                    <input
                      type="password"
                      inputMode="numeric"
                      value={f.cvv}
                      placeholder="•••"
                      autoComplete="off"
                      onChange={(e) => set('cvv', e.target.value.replace(/\D/g, '').slice(0, 3))}
                    />
                  </label>
                </div>
              </div>
            )}

            {/* NET BANKING DEMO */}
            {method === 'NET' && (
              <div className="form pay-panel">
                <span className="lbl">Select Your Bank</span>
                <div className="bank-grid">
                  {BANKS.map((b) => (
                    <button
                      key={b}
                      type="button"
                      className={`bank ${f.bank === b ? 'on' : ''}`}
                      onClick={() => set('bank', b)}
                    >
                      <span className="bank-ico">🏦</span>
                      <span>{b}</span>
                    </button>
                  ))}
                </div>

                {f.bank && (
                  <div className="bank-login">
                    <b style={{ color: 'var(--ink)' }}>🏦 {f.bank} — Net Banking Portal</b>
                    <label>
                      User ID
                      <input
                        value={f.netUser}
                        onChange={(e) => set('netUser', e.target.value)}
                        placeholder="Enter your User ID"
                        autoComplete="off"
                      />
                    </label>
                    <label>
                      Password
                      <input
                        type="password"
                        value={f.netPass}
                        onChange={(e) => set('netPass', e.target.value)}
                        placeholder="Enter your Password"
                        autoComplete="new-password"
                      />
                    </label>
                  </div>
                )}
              </div>
            )}

            {payError && <div className="alert alert-error pay-err">{payError}</div>}
            
            <p className="demo-note">
              ℹ️ Demo Gateway: No real money is charged. Enter sample values to experience the realistic payment workflow.
            </p>
          </section>
        </div>

        {/* Trip & Fare Summary */}
        <aside className="panel summary">
          <div className="panel-head"><h3>Trip Summary</h3></div>
          <dl className="sum-list">
            <div><dt>Bus Operator</dt><dd><b>{bus.name}</b></dd></div>
            <div><dt>Route</dt><dd>{bus.source} → {bus.destination}</dd></div>
            <div><dt>Date</dt><dd>{fmtDate(bus.departureTime)}</dd></div>
            <div><dt>Departure</dt><dd>{fmtDateTime(bus.departureTime)}</dd></div>
            <div><dt>Duration</dt><dd>{fmtDuration(bus.durationMinutes)}</dd></div>
            <div><dt>Selected Seats</dt><dd><b>{seats.join(', ')}</b></dd></div>

            {pickupPoint && (
              <div>
                <dt>Pick-up Point</dt>
                <dd className="sum-stop">
                  <b>📍 {pickupPoint.name}</b>
                  <small>({pickupPoint.time})</small>
                </dd>
              </div>
            )}

            {dropPoint && (
              <div>
                <dt>Dropping Point</dt>
                <dd className="sum-stop">
                  <b>🚩 {dropPoint.name}</b>
                  <small>({dropPoint.time})</small>
                </dd>
              </div>
            )}

            <div><dt>Fare Details</dt><dd>{money(bus.fare)} × {seats.length} seats</dd></div>
          </dl>
          
          <div className="sum-total">
            <span>Total Payable Amount</span>
            <b>{money(total)}</b>
          </div>

          <button
            className="btn btn-primary btn-block"
            onClick={handleProceedToPay}
            disabled={!!stage}
          >
            Proceed to Pay {money(total)}
          </button>
        </aside>
      </div>

      {/* Confirmation Modal for UPI / NetBanking */}
      {asking && (
        <Modal
          title="Confirm Payment"
          onClose={() => setAsking(false)}
          footer={
            <>
              <button className="btn btn-ghost" onClick={() => setAsking(false)}>Cancel</button>
              <button className="btn btn-success" onClick={executePayment}>Approve &amp; Pay</button>
            </>
          }
        >
          <p style={{ margin: 0 }}>
            Pay <b>{money(total)}</b> via <b>{payLabel()}</b> to confirm your seats <b>{seats.join(', ')}</b> on <b>{bus.name}</b>?
          </p>
        </Modal>
      )}

      {/* Card 3D-Secure OTP Simulation Modal */}
      {otpModal && (
        <Modal
          title="🏦 Bank 3D-Secure Verification"
          onClose={() => setOtpModal(false)}
          footer={
            <>
              <button className="btn btn-ghost" onClick={() => setOtpModal(false)}>Cancel</button>
              <button className="btn btn-success" onClick={executePayment}>Submit OTP &amp; Pay</button>
            </>
          }
        >
          <div className="otp-modal-content">
            <p>An OTP has been sent to your registered mobile number ending in <b>******3210</b>.</p>
            <div className="form">
              <label>
                Enter 6-Digit One-Time Password (OTP)
                <input
                  value={f.otp || ''}
                  onChange={(e) => set('otp', e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="123456"
                  maxLength={6}
                  style={{ letterSpacing: '0.3em', fontSize: '1.2rem', textAlign: 'center' }}
                />
              </label>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => set('otp', '123456')}
                style={{ marginTop: '0.4rem', alignSelf: 'flex-start' }}
              >
                ⚡ Use Demo OTP: 123456
              </button>
            </div>
            <small className="muted" style={{ display: 'block', marginTop: '0.8rem' }}>
              Amount: <b>{money(total)}</b> | Merchant: <b>BusGo Ticket Booking</b>
            </small>
          </div>
        </Modal>
      )}

      {/* Full Gateway Processing Overlay */}
      {stage && (
        <div className="gateway">
          <div className="gw-box">
            {stage === 'verifying' || stage === 'authorizing' ? (
              <>
                <div className="spinner" />
                <h3>{stage === 'verifying' ? 'Connecting Gateway...' : 'Authorizing Payment...'}</h3>
                <p className="muted">{processingMessage}</p>
                <div className="gw-amount-badge">{money(total)}</div>
                {txnId && <small className="gw-txnid">Ref ID: {txnId}</small>}
                <small className="muted" style={{ display: 'block', marginTop: '0.6rem', fontSize: '0.75rem' }}>
                  🔒 Secure transaction. Please do not refresh or close this window.
                </small>
              </>
            ) : (
              <>
                <div className="success-tick sm">✓</div>
                <h3>Payment Successful!</h3>
                <p className="gw-amount-badge">{money(total)}</p>
                {txnId && <small className="gw-txnid">Txn Ref: {txnId}</small>}
                <small className="muted" style={{ display: 'block', marginTop: '0.6rem' }}>
                  Confirming your seats and generating e-ticket...
                </small>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
