import { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import api, { errMsg } from '../../api/axios'
import { fetchBuses } from '../../store/busSlice'
import { fetchOperators } from '../../store/adminSlice'
import { showToast } from '../../store/uiSlice'
import Modal from '../../components/Modal'
import Badge from '../../components/Badge'
import { Loading, Empty, ErrorBox } from '../../components/State'
import { fmtDateTime, fmtDuration, money, toInputDateTime } from '../../utils/format'

const blank = {
  name: '', source: '', destination: '', departureTime: '', durationMinutes: 480,
  totalSeats: 40, fare: '', busType: 'AC Sleeper', amenities: '', operatorId: '',
}
const TYPES = ['AC Sleeper', 'AC Semi-Sleeper', 'AC Seater', 'Volvo Multi-Axle AC', 'Non-AC Seater', 'Non-AC Sleeper']

export default function Buses() {
  const dispatch = useDispatch()
  const { list, loading, error } = useSelector((s) => s.buses)
  const operators = useSelector((s) => s.admin.operators)
  const [form, setForm] = useState(null)
  const [editId, setEditId] = useState(null)
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)
  const [toCancel, setToCancel] = useState(null)
  const [filter, setFilter] = useState('')

  const load = () => dispatch(fetchBuses())
  useEffect(() => { load(); dispatch(fetchOperators()) }, [])

  const shown = useMemo(() => list.filter((b) => !filter || String(b.operatorId) === filter), [list, filter])

  const openAdd = () => { setEditId(null); setFormError(''); setForm({ ...blank, operatorId: operators[0]?.id || '' }) }
  const openEdit = (b) => {
    setEditId(b.id); setFormError('')
    setForm({
      name: b.name, source: b.source, destination: b.destination, departureTime: toInputDateTime(b.departureTime),
      durationMinutes: b.durationMinutes, totalSeats: b.totalSeats, fare: b.fare, busType: b.busType || '',
      amenities: b.amenities || '', operatorId: b.operatorId,
    })
  }

  const save = async (e) => {
    e.preventDefault()
    setSaving(true); setFormError('')
    const body = {
      ...form,
      durationMinutes: Number(form.durationMinutes), totalSeats: Number(form.totalSeats),
      fare: Number(form.fare), operatorId: Number(form.operatorId),
    }
    try {
      if (editId) await api.put(`/buses/${editId}`, body)
      else await api.post('/buses', body)
      dispatch(showToast({ text: editId ? 'Bus updated' : 'Bus added' }))
      setForm(null); load(); dispatch(fetchOperators())
    } catch (err) { setFormError(errMsg(err)) }
    setSaving(false)
  }

  const confirmCancel = async () => {
    try {
      const { data } = await api.delete(`/buses/${toCancel.id}`)
      dispatch(showToast({ text: data.message }))
    } catch (err) { dispatch(showToast({ type: 'error', text: errMsg(err) })) }
    setToCancel(null); load(); dispatch(fetchOperators())
  }

  const f = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  return (
    <>
      <div className="page-head">
        <div><h1>Buses</h1><p className="muted">All buses across every operator.</p></div>
        <div className="head-actions">
          <select value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="Filter by operator">
            <option value="">All operators</option>
            {operators.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
          </select>
          <button className="btn btn-primary" onClick={openAdd} disabled={!operators.length}>＋ Add bus</button>
        </div>
      </div>
      {!operators.length && <div className="alert alert-warn">Add an operator first — every bus must be assigned to one.</div>}
      <ErrorBox message={error} onRetry={load} />
      {loading && !list.length ? <Loading /> : !shown.length ? (
        <Empty icon="🚌" title="No buses found" hint="Add a bus and assign it to an operator." />
      ) : (
        <div className="table-wrap panel">
          <table className="table">
            <thead><tr><th>Bus</th><th>Operator</th><th>Route</th><th>Departure</th><th>Seats</th><th>Fare</th><th>Status</th><th className="right">Actions</th></tr></thead>
            <tbody>
              {shown.map((b) => (
                <tr key={b.id} className={b.status === 'CANCELLED' ? 'row-dim' : ''}>
                  <td><b>{b.name}</b><br /><span className="muted">{b.busType}</span></td>
                  <td>{b.operatorName}</td>
                  <td>{b.source} → {b.destination}<br /><span className="muted">{fmtDuration(b.durationMinutes)}</span></td>
                  <td>{fmtDateTime(b.departureTime)}</td>
                  <td>{b.bookedCount}/{b.totalSeats} booked</td>
                  <td>{money(b.fare)}</td>
                  <td><Badge tone={b.status === 'ACTIVE' ? 'green' : 'red'}>{b.status === 'ACTIVE' ? 'Active' : 'Cancelled'}</Badge></td>
                  <td className="right nowrap">
                    {b.status === 'ACTIVE' && <button className="btn btn-sm btn-ghost" onClick={() => openEdit(b)}>Edit</button>}{' '}
                    {(b.status === 'ACTIVE' || b.bookingCount === 0) && (
                      <button className="btn btn-sm btn-danger" onClick={() => setToCancel(b)}>{b.bookingCount > 0 ? 'Cancel bus' : 'Delete'}</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {form && (
        <Modal title={editId ? 'Edit bus' : 'Add bus'} onClose={() => setForm(null)} wide>
          <form className="form" onSubmit={save}>
            {formError && <div className="alert alert-error">{formError}</div>}
            <div className="grid-2">
              <label>Bus name<input value={form.name} onChange={f('name')} required /></label>
              <label>Assigned operator
                <select value={form.operatorId} onChange={f('operatorId')} required>
                  <option value="" disabled>Select operator</option>
                  {operators.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
                </select>
              </label>
              <label>From<input value={form.source} onChange={f('source')} required /></label>
              <label>To<input value={form.destination} onChange={f('destination')} required /></label>
              <label>Departure<input type="datetime-local" value={form.departureTime} onChange={f('departureTime')} required /></label>
              <label>Duration (minutes)<input type="number" min="30" value={form.durationMinutes} onChange={f('durationMinutes')} required /></label>
              <label>Total seats<input type="number" min="1" max="80" value={form.totalSeats} onChange={f('totalSeats')} required /></label>
              <label>Fare per seat (₹)<input type="number" min="1" step="0.01" value={form.fare} onChange={f('fare')} required /></label>
              <label>Bus type
                <select value={form.busType} onChange={f('busType')}>
                  {TYPES.map((t) => <option key={t}>{t}</option>)}
                </select>
              </label>
              <label>Amenities (comma separated)<input value={form.amenities} onChange={f('amenities')} placeholder="WiFi, Charging Point, Blanket" /></label>
            </div>
            <div className="modal-actions">
              <button type="button" className="btn btn-ghost" onClick={() => setForm(null)}>Close</button>
              <button className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : editId ? 'Save changes' : 'Add bus'}</button>
            </div>
          </form>
        </Modal>
      )}

      {toCancel && (
        <Modal title={toCancel.bookingCount > 0 ? 'Cancel this bus?' : 'Delete this bus?'} onClose={() => setToCancel(null)}
          footer={<><button className="btn btn-ghost" onClick={() => setToCancel(null)}>Keep bus</button>
            <button className="btn btn-danger" onClick={confirmCancel}>{toCancel.bookingCount > 0 ? 'Cancel bus & notify customers' : 'Delete bus'}</button></>}>
          {toCancel.bookingCount > 0 ? (
            <p><b>{toCancel.name}</b> has {toCancel.bookingCount} booking(s). The bus will be marked <b>cancelled</b> (booking history is kept) and every affected customer gets the notification “Sorry, your bus has been cancelled.”</p>
          ) : (
            <p><b>{toCancel.name}</b> has no bookings, so it will be deleted permanently.</p>
          )}
        </Modal>
      )}
    </>
  )
}
