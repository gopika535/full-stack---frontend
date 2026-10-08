import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { fetchBuses, searchBuses } from '../../store/busSlice'
import { Loading, Empty, ErrorBox } from '../../components/State'
import { fmtDate, fmtDuration, fmtTime, money, todayISO } from '../../utils/format'

export default function FindBuses() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { list, loading, error } = useSelector((s) => s.buses)
  const [q, setQ] = useState({ from: '', to: '', date: '' })
  const [searched, setSearched] = useState(false)

  const load = () => dispatch(fetchBuses())
  useEffect(() => { load() }, [])

  const search = (e) => { e.preventDefault(); setSearched(true); dispatch(searchBuses(q)) }
  const reset = () => { setQ({ from: '', to: '', date: '' }); setSearched(false); load() }
  const swap = () => setQ({ ...q, from: q.to, to: q.from })

  return (
    <>
      <div className="page-head"><div><h1>Find your bus</h1><p className="muted">Pick a route and date, then choose your seats.</p></div></div>
      <form className="search-bar panel" onSubmit={search}>
        <label>From<input value={q.from} onChange={(e) => setQ({ ...q, from: e.target.value })} placeholder="e.g. Chennai" /></label>
        <button type="button" className="swap" onClick={swap} aria-label="Swap">⇄</button>
        <label>To<input value={q.to} onChange={(e) => setQ({ ...q, to: e.target.value })} placeholder="e.g. Bangalore" /></label>
        <label>Date<input type="date" min={todayISO()} value={q.date} onChange={(e) => setQ({ ...q, date: e.target.value })} /></label>
        <div className="search-actions">
          <button className="btn btn-primary">Search buses</button>
          {searched && <button type="button" className="btn btn-ghost" onClick={reset}>Show all</button>}
        </div>
      </form>

      <ErrorBox message={error} onRetry={load} />
      {loading ? <Loading text="Finding buses…" /> : !list.length ? (
        <Empty icon="🛣️" title="No buses match" hint="Try another date or clear the filters to see every available bus." />
      ) : (
        <div className="ticket-list">
          <p className="muted">{list.length} bus{list.length > 1 ? 'es' : ''} available</p>
          {list.map((b) => (
            <article key={b.id} className="bus-ticket">
              <div className="bt-main">
                <div className="bt-head"><h3>{b.name}</h3><span className="type-tag">{b.busType}</span></div>
                <div className="bt-route">
                  <div><b>{fmtTime(b.departureTime)}</b><small>{b.source}</small></div>
                  <div className="bt-line"><span>{fmtDuration(b.durationMinutes)}</span></div>
                  <div><b>{fmtTime(b.arrivalTime)}</b><small>{b.destination}</small></div>
                </div>
                <div className="bt-meta">
                  <span>📅 {fmtDate(b.departureTime)}</span>
                  <span className={b.availableSeats <= 5 ? 'low' : ''}>💺 {b.availableSeats} seats left</span>
                  {b.amenities && <span className="amen">{b.amenities.split(',').map((a) => a.trim()).filter(Boolean).slice(0, 4).join(' · ')}</span>}
                </div>
              </div>
              <div className="bt-stub">
                <small>from</small>
                <b>{money(b.fare)}</b>
                <button className="btn btn-primary" disabled={b.availableSeats === 0} onClick={() => navigate(`/customer/bus/${b.id}`)}>
                  {b.availableSeats === 0 ? 'Sold out' : 'Select seats'}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  )
}
