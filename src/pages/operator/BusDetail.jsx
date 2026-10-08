import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useParams } from 'react-router-dom'
import { fetchOperatorBusDetail, clearCurrent } from '../../store/busSlice'
import Badge from '../../components/Badge'
import SeatGrid from '../../components/SeatGrid'
import BookingTable from '../../components/BookingTable'
import { Loading, ErrorBox } from '../../components/State'
import { fmtDateTime, fmtDuration, money } from '../../utils/format'

export default function BusDetail() {
  const { id } = useParams()
  const dispatch = useDispatch()
  const { operatorDetail: d, loading, error } = useSelector((s) => s.buses)
  const load = () => dispatch(fetchOperatorBusDetail(id))
  useEffect(() => { load(); return () => dispatch(clearCurrent()) }, [id])

  if (error) return <><Link to="/operator" className="back">← My buses</Link><ErrorBox message={error} onRetry={load} /></>
  if (loading || !d) return <Loading />
  const b = d.bus
  const info = [
    ['Bus name', b.name], ['Source', b.source], ['Destination', b.destination],
    ['Departure time', fmtDateTime(b.departureTime)], ['Journey duration', fmtDuration(b.durationMinutes)],
    ['Total seats', b.totalSeats], ['Available seats', b.availableSeats], ['Booked seats', b.bookedCount],
    ['Fare per seat', money(b.fare)], ['Bus type', b.busType || '-'], ['Amenities', b.amenities || '-'],
  ]

  return (
    <>
      <Link to="/operator" className="back">← My buses</Link>
      <div className="page-head">
        <div><h1>{b.name}</h1><p className="muted">{b.source} → {b.destination}</p></div>
        <Badge tone={b.status === 'ACTIVE' ? 'green' : 'red'}>{b.status === 'ACTIVE' ? 'Active' : 'Cancelled'}</Badge>
      </div>
      <div className="two-col">
        <section className="panel">
          <div className="panel-head"><h3>Bus details</h3></div>
          <dl className="info-grid">
            {info.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}
          </dl>
        </section>
        <section className="panel">
          <div className="panel-head"><h3>Seat map</h3></div>
          <SeatGrid total={b.totalSeats} booked={b.bookedSeats || []} womenBooked={b.womenBookedSeats || []} womenPreferred={b.womenPreferredSeats || []} readOnly />
        </section>
      </div>
      <section className="panel">
        <div className="panel-head"><h3>Customer bookings ({d.bookings.length})</h3></div>
        <BookingTable bookings={d.bookings} showBus={false} />
      </section>
    </>
  )
}
