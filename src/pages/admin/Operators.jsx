import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import api, { errMsg } from '../../api/axios'
import { fetchOperators } from '../../store/adminSlice'
import { showToast } from '../../store/uiSlice'
import Modal from '../../components/Modal'
import { Loading, Empty, ErrorBox } from '../../components/State'

const blank = { name: '', email: '', mobile: '', password: '' }

export default function Operators() {
  const dispatch = useDispatch()
  const { operators, loading, error } = useSelector((s) => s.admin)
  const [form, setForm] = useState(null)       // null = closed
  const [editId, setEditId] = useState(null)
  const [toDelete, setToDelete] = useState(null)
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)

  const load = () => dispatch(fetchOperators())
  useEffect(() => { load() }, [])

  const openAdd = () => { setEditId(null); setForm(blank); setFormError('') }
  const openEdit = (o) => { setEditId(o.id); setForm({ name: o.name, email: o.email, mobile: o.mobile, password: '' }); setFormError('') }

  const save = async (e) => {
    e.preventDefault()
    setSaving(true); setFormError('')
    try {
      if (editId) await api.put(`/admin/operators/${editId}`, form)
      else await api.post('/admin/operators', form)
      dispatch(showToast({ text: editId ? 'Operator updated' : 'Operator added' }))
      setForm(null); load()
    } catch (err) { setFormError(errMsg(err)) }
    setSaving(false)
  }

  const remove = async () => {
    try {
      await api.delete(`/admin/operators/${toDelete.id}`)
      dispatch(showToast({ text: 'Operator removed' }))
      setToDelete(null); load()
    } catch (err) { dispatch(showToast({ type: 'error', text: errMsg(err) })); setToDelete(null) }
  }

  const f = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  return (
    <>
      <div className="page-head">
        <div><h1>Operators</h1><p className="muted">Add as many operators as you need and assign buses to them.</p></div>
        <button className="btn btn-primary" onClick={openAdd}>＋ Add operator</button>
      </div>
      <ErrorBox message={error} onRetry={load} />
      {loading && !operators.length ? <Loading /> : !operators.length ? (
        <Empty icon="🧑‍✈️" title="No operators yet" hint="Add your first operator to start assigning buses."><button className="btn btn-primary" onClick={openAdd}>Add operator</button></Empty>
      ) : (
        <div className="table-wrap panel">
          <table className="table">
            <thead><tr><th>Name</th><th>Email</th><th>Mobile</th><th>Buses</th><th className="right">Actions</th></tr></thead>
            <tbody>
              {operators.map((o) => (
                <tr key={o.id}>
                  <td><b>{o.name}</b></td><td>{o.email}</td><td>{o.mobile}</td>
                  <td><span className="count-pill dark">{o.count}</span></td>
                  <td className="right">
                    <button className="btn btn-sm btn-ghost" onClick={() => openEdit(o)}>Edit</button>{' '}
                    <button className="btn btn-sm btn-danger" onClick={() => setToDelete(o)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {form && (
        <Modal title={editId ? 'Edit operator' : 'Add operator'} onClose={() => setForm(null)}>
          <form className="form" onSubmit={save}>
            {formError && <div className="alert alert-error">{formError}</div>}
            <label>Name<input value={form.name} onChange={f('name')} required /></label>
            <label>Email (used to log in)<input type="email" value={form.email} onChange={f('email')} required /></label>
            <label>Mobile<input value={form.mobile} onChange={f('mobile')} required /></label>
            <label>{editId ? 'New password (leave blank to keep current)' : 'Password'}
              <input type="password" value={form.password} onChange={f('password')} minLength={editId ? 0 : 6} required={!editId} />
            </label>
            <div className="modal-actions">
              <button type="button" className="btn btn-ghost" onClick={() => setForm(null)}>Cancel</button>
              <button className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save operator'}</button>
            </div>
          </form>
        </Modal>
      )}

      {toDelete && (
        <Modal title="Delete operator?" onClose={() => setToDelete(null)}
          footer={<><button className="btn btn-ghost" onClick={() => setToDelete(null)}>Keep operator</button><button className="btn btn-danger" onClick={remove}>Delete {toDelete.name}</button></>}>
          <p>This removes <b>{toDelete.name}</b>. Operators who still have buses cannot be deleted — reassign their buses first.</p>
        </Modal>
      )}
    </>
  )
}
