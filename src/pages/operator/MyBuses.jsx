import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { fetchOperatorBuses } from '../../store/busSlice'
import Badge from '../../components/Badge'
import { Loading, Empty, ErrorBox } from '../../components/State'
import { fmtDateTime, fmtDuration, money } from '../../utils/format'

export default function MyBuses() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { list, loading, error } = useSelector((s) => s.buses)
  const user = useSelector((s) => s.auth.user)
  const load = () => dispatch(fetchOperatorBuses())
  useEffect(() => { load() }, [])

  return (
    <>
      <div className="page-head"><div><h1>My buses</h1><p className="muted">{user.name}, these are the buses assigned to you. Select one for details and passengers.</p></div></div>
      <ErrorBox message={error} onRetry={load} />
      {loading && !list.length ? <Loading /> : !list.length ? (
        <Empty icon="🚌" title="No buses assigned yet" hint="The admin can assign buses to you from the Buses page." />
      ) : (
        <div className="card-grid">
          {list.map((b) => (
            <button key={b.id} className={`panel bus-tile ${b.status === 'CANCELLED' ? 'row-dim' : ''}`} onClick={() => navigate(`/operator/bus/${b.id}`)}>
              <div className="tile-top"><h3>{b.name}</h3><Badge tone={b.status === 'ACTIVE' ? 'green' : 'red'}>{b.status === 'ACTIVE' ? 'Active' : 'Cancelled'}</Badge></div>
              <div className="tile-route">{b.source} <i>→</i> {b.destination}</div>
              <div className="muted">{fmtDateTime(b.departureTime)} · {fmtDuration(b.durationMinutes)}</div>
              <div className="meter"><span style={{ width: `${(b.bookedCount / b.totalSeats) * 100}%` }} /></div>
              <div className="tile-foot"><span><b>{b.bookedCount}</b> / {b.totalSeats} seats booked</span><b>{money(b.fare)}</b></div>
            </button>
          ))}
        </div>
      )}
    </>
  )
}
