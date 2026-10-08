import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import api, { errMsg } from '../../api/axios'
import { fetchCustomers } from '../../store/adminSlice'
import Modal from '../../components/Modal'
import BookingTable from '../../components/BookingTable'
import { Loading, Empty, ErrorBox } from '../../components/State'

export default function Customers() {
  const dispatch = useDispatch()
  const { customers, loading, error } = useSelector((s) => s.admin)
  const [selected, setSelected] = useState(null)
  const [bookings, setBookings] = useState([])
  const [bLoading, setBLoading] = useState(false)
  const [bError, setBError] = useState('')
  const [q, setQ] = useState('')

  const load = () => dispatch(fetchCustomers())
  useEffect(() => { load() }, [])

  const open = async (c) => {
    setSelected(c); setBookings([]); setBError(''); setBLoading(true)
    try { setBookings((await api.get(`/admin/users/${c.id}/bookings`)).data) }
    catch (e) { setBError(errMsg(e)) }
    setBLoading(false)
  }

  const shown = customers.filter((c) => (c.name + c.email + c.mobile).toLowerCase().includes(q.toLowerCase()))

  return (
    <>
      <div className="page-head">
        <div><h1>Customers</h1><p className="muted">Registered customers and their bookings.</p></div>
        <input className="search" placeholder="Search name, email or mobile" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <ErrorBox message={error} onRetry={load} />
      {loading && !customers.length ? <Loading /> : !shown.length ? <Empty icon="👥" title="No customers found" /> : (
        <div className="table-wrap panel">
          <table className="table">
            <thead><tr><th>Name</th><th>Email</th><th>Mobile</th><th>Bookings</th><th className="right">Actions</th></tr></thead>
            <tbody>
              {shown.map((c) => (
                <tr key={c.id}>
                  <td><b>{c.name}</b></td><td>{c.email}</td><td>{c.mobile}</td>
                  <td><span className="count-pill dark">{c.count}</span></td>
                  <td className="right"><button className="btn btn-sm btn-ghost" onClick={() => open(c)}>View bookings</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {selected && (
        <Modal title={`${selected.name}'s bookings`} onClose={() => setSelected(null)} wide>
          {bLoading ? <Loading /> : bError ? <div className="alert alert-error">{bError}</div> : <BookingTable bookings={bookings} showOperator />}
        </Modal>
      )}
    </>
  )
}
