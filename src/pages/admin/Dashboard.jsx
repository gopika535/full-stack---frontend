import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchStats, fetchAllBookings } from '../../store/adminSlice'
import { Loading, ErrorBox } from '../../components/State'
import BookingTable from '../../components/BookingTable'
import { money } from '../../utils/format'

export default function Dashboard() {
  const dispatch = useDispatch()
  const { stats, bookings, loading, error } = useSelector((s) => s.admin)
  const load = () => { dispatch(fetchStats()); dispatch(fetchAllBookings()) }
  useEffect(load, [dispatch])

  const cards = stats && [
    ['Customers', stats.totalCustomers, '👥', 'blue'],
    ['Operators', stats.totalOperators, '🧑‍✈️', 'teal'],
    ['Buses', stats.totalBuses, '🚌', 'yellow'],
    ['Bookings', stats.totalBookings, '🎫', 'purple'],
    ['Revenue', money(stats.revenue), '💰', 'green'],
  ]

  return (
    <>
      <div className="page-head"><div><h1>Dashboard</h1><p className="muted">Live numbers from the BusGo database.</p></div></div>
      <ErrorBox message={error} onRetry={load} />
      {!stats && loading && <Loading />}
      {stats && (
        <>
          <div className="stat-grid">
            {cards.map(([label, value, icon, tone]) => (
              <div key={label} className={`stat-card tone-${tone}`}>
                <div className="stat-icon">{icon}</div>
                <div><div className="stat-value">{value}</div><div className="stat-label">{label}</div></div>
              </div>
            ))}
          </div>
          <div className="mini-row">
            <span>Active buses <b>{stats.activeBuses}</b></span>
            <span>Cancelled buses <b>{stats.cancelledBuses}</b></span>
            <span>Confirmed bookings <b>{stats.confirmedBookings}</b></span>
            <span>Feedback received <b>{stats.totalFeedback}</b></span>
          </div>
        </>
      )}
      <section className="panel">
        <div className="panel-head"><h3>Latest bookings</h3></div>
        <BookingTable bookings={bookings.slice(0, 6)} showOperator />
      </section>
    </>
  )
}
