import { useEffect, useState } from 'react'
import api, { errMsg } from '../../api/axios'
import BookingTable from '../../components/BookingTable'
import { Loading, ErrorBox } from '../../components/State'

export default function Bookings() {
  const [bookings, setBookings] = useState(null)
  const [error, setError] = useState('')
  const load = async () => {
    setError('')
    try { setBookings((await api.get('/operator/bookings')).data) } catch (e) { setError(errMsg(e)) }
  }
  useEffect(() => { load() }, [])
  return (
    <>
      <div className="page-head"><div><h1>Bookings on my buses</h1><p className="muted">Only bookings for buses assigned to you are shown.</p></div></div>
      <ErrorBox message={error} onRetry={load} />
      {!bookings && !error ? <Loading /> : bookings && <div className="panel"><BookingTable bookings={bookings} /></div>}
    </>
  )
}
