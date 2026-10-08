import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchAllBookings } from '../../store/adminSlice'
import BookingTable from '../../components/BookingTable'
import { Loading, ErrorBox } from '../../components/State'

export default function Bookings() {
  const dispatch = useDispatch()
  const { bookings, loading, error } = useSelector((s) => s.admin)
  const [q, setQ] = useState('')
  const load = () => dispatch(fetchAllBookings())
  useEffect(() => { load() }, [])
  const shown = bookings.filter((b) =>
    `${b.bookingCode} ${b.customerName} ${b.customerEmail} ${b.busName} ${b.operatorName} ${b.medicalIssueDetails || ''}`.toLowerCase().includes(q.toLowerCase()))
  return (
    <>
      <div className="page-head">
        <div><h1>All bookings</h1><p className="muted">Every ticket booked on BusGo.</p></div>
        <input className="search" placeholder="Search booking ID, customer, bus, medical issue…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <ErrorBox message={error} onRetry={load} />
      {loading && !bookings.length ? <Loading /> : <div className="panel"><BookingTable bookings={shown} showOperator /></div>}
    </>
  )
}
