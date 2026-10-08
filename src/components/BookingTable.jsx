import Badge from './Badge'
import { Empty } from './State'
import { fmtDateTime, money, bookingState } from '../utils/format'

// Shared table for admin / operator booking lists
export default function BookingTable({ bookings, showBus = true, showOperator = false }) {
  if (!bookings.length) return <Empty icon="🎫" title="No bookings yet" hint="Bookings will appear here as customers book tickets." />
  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            <th>Booking ID</th><th>Customer</th><th>Contact</th>
            {showBus && <th>Bus / Route</th>}
            {showOperator && <th>Operator</th>}
            <th>Seats</th><th>Fare</th><th>Journey</th><th>Status</th>
          </tr>
        </thead>
        <tbody>
          {bookings.map((b) => {
            const st = bookingState(b)
            return (
              <tr key={b.id}>
                <td>
                  <b>{b.customerName}</b>
                  {b.medicalAssistance && (
                    <div style={{ marginTop: '0.3rem' }}>
                      <span
                        style={{
                          background: '#fff1f2',
                          border: '1px solid #fecdd3',
                          color: '#e11d48',
                          padding: '0.2rem 0.55rem',
                          borderRadius: '6px',
                          fontSize: '0.74rem',
                          fontWeight: 700,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.3rem',
                          boxShadow: '0 1px 2px rgba(225, 29, 72, 0.08)',
                        }}
                        title={`Medical Assistance Required: ${b.medicalIssueDetails || 'Yes'}`}
                      >
                        🚑 Special Aid: {b.medicalIssueDetails || 'Medical Assistance Req.'}
                      </span>
                    </div>
                  )}
                </td>
                <td className="muted">{b.customerEmail}<br />{b.customerMobile}</td>
                {showBus && <td><b>{b.busName}</b><br /><span className="muted">{b.source} → {b.destination}</span></td>}
                {showOperator && <td>{b.operatorName}</td>}
                <td>
                  <b>{b.seats.join(', ')}</b>
                  {b.passengers && b.passengers.length > 0 && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '0.2rem' }}>
                      {b.passengers.map((p, idx) => (
                        <div key={idx}>
                          #{p.seatNumber}: {p.name} ({p.gender}) {p.womenPreference ? '💖' : ''}
                        </div>
                      ))}
                    </div>
                  )}
                </td>
                <td><b>{money(b.totalFare)}</b></td>
                <td>{fmtDateTime(b.departureTime)}</td>
                <td><Badge tone={st.tone}>{st.label}</Badge></td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
