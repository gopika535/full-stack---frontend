// Blue = available, Red = booked, Green = selected, Pink = Women Booking, Grey = Women Preferred (Next to Women). Layout: 2 + aisle + 2 per row.
export default function SeatGrid({ total, booked = [], womenBooked = [], womenPreferred = [], selected = [], onToggle, readOnly }) {
  const rows = Math.ceil(total / 4)
  const seat = (n) => {
    if (n > total) return <span key={n} className="seat-gap" />
    const isWomenBooked = womenBooked.includes(n)
    const isBooked = booked.includes(n) || isWomenBooked
    const isSel = selected.includes(n)
    const isWomenPref = womenPreferred.includes(n)

    const cls = isWomenBooked
      ? 'booked women-booked'
      : isBooked
      ? 'booked'
      : isSel
      ? 'selected'
      : isWomenPref
      ? 'women-preferred'
      : 'available'

    const title = isWomenBooked
      ? `Seat ${n} · Women Booking (Booked)`
      : isBooked
      ? `Seat ${n} · Booked`
      : isSel
      ? `Seat ${n} · Selected`
      : isWomenPref
      ? `Seat ${n} · Warning: prefered for womens only (next to women booked seat)`
      : `Seat ${n} · Available`

    return (
      <button
        key={n}
        type="button"
        className={`seat ${cls}`}
        disabled={isBooked || readOnly}
        onClick={() => onToggle && onToggle(n)}
        title={title}
        aria-label={`Seat ${n} ${cls}`}
      >{n}</button>
    )
  }
  return (
    <div className="seat-wrap">
      <div className="legend">
        <span><i className="seat-dot available" /> Available</span>
        <span><i className="seat-dot booked" /> Booked</span>
        <span><i className="seat-dot women-booked" /> Women Booking</span>
        <span><i className="seat-dot women-preferred" /> Women Preferred (Next to Women)</span>
        <span><i className="seat-dot selected" /> Selected</span>
      </div>
      <div className="bus-body">
        <div className="driver">🛞 Driver</div>
        {Array.from({ length: rows }, (_, r) => {
          const b = r * 4
          return (
            <div className="seat-row" key={r}>
              {seat(b + 1)}{seat(b + 2)}<span className="aisle" />{seat(b + 3)}{seat(b + 4)}
            </div>
          )
        })}
      </div>
    </div>
  )
}
