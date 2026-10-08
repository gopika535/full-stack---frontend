import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { register, clearError } from '../store/authSlice'
import { showToast } from '../store/uiSlice'
import RouteLine from '../components/RouteLine'

export default function Register() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { loading, error } = useSelector((s) => s.auth)
  const [form, setForm] = useState({ name: '', email: '', mobile: '', password: '', confirm: '' })
  const [localError, setLocalError] = useState('')
  const set = (k) => (e) => { dispatch(clearError()); setLocalError(''); setForm({ ...form, [k]: e.target.value }) }

  const submit = async (e) => {
    e.preventDefault()
    if (form.password !== form.confirm) return setLocalError('Passwords do not match')
    const { confirm, ...body } = form
    const res = await dispatch(register(body))
    if (register.fulfilled.match(res)) {
      dispatch(showToast({ text: 'Account created. Please log in.' }))
      navigate('/login')
    }
  }

  return (
    <div className="auth-page">
      <section className="auth-hero">
        <div className="brand brand-lg"><span className="brand-mark">🚌</span> BusGo</div>
        <h1>Your seat is<br />one signup away.</h1>
        <p>Create a customer account to search buses, book seats and download tickets.</p>
        
        {/* S-Curved Dotted Route Line with Forward-Facing Bus in Slow Motion */}
        <RouteLine from="Source" to="Destination" />
      </section>

      <section className="auth-card">
        <h2>Create account</h2>
        {(localError || error) && <div className="alert alert-error">{localError || error}</div>}
        <form onSubmit={submit} className="form">
          <label>Full name<input value={form.name} onChange={set('name')} required /></label>
          <label>Email<input type="email" value={form.email} onChange={set('email')} required /></label>
          <label>Mobile<input value={form.mobile} onChange={set('mobile')} placeholder="10-digit number" required /></label>
          <div className="grid-2">
            <label>Password<input type="password" value={form.password} onChange={set('password')} minLength={6} required /></label>
            <label>Confirm password<input type="password" value={form.confirm} onChange={set('confirm')} required /></label>
          </div>
          <button className="btn btn-primary btn-block" disabled={loading}>{loading ? 'Creating…' : 'Register'}</button>
        </form>
        <p className="center">Already registered? <Link to="/login">Log in</Link></p>
      </section>
    </div>
  )
}
