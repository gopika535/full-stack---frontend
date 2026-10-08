import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { login, clearError } from '../store/authSlice'
import { homeFor } from '../components/ProtectedRoute'
import RouteLine from '../components/RouteLine'

const QUICK = [
  ['Admin', 'admin@busgo.com', 'Admin@123'],
  ['Operator Ram', 'ram@busgo.com', 'Operator@123'],
  ['Customer', 'customer@busgo.com', 'Customer@123'],
]

export default function Login() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { loading, error } = useSelector((s) => s.auth)
  const [form, setForm] = useState({ email: '', password: '' })
  const set = (k) => (e) => { dispatch(clearError()); setForm({ ...form, [k]: e.target.value }) }

  const submit = async (e) => {
    e.preventDefault()
    const res = await dispatch(login(form))
    if (login.fulfilled.match(res)) navigate(homeFor(res.payload.role), { replace: true })
  }

  return (
    <div className="auth-page">
      <section className="auth-hero">
        <div className="brand brand-lg"><span className="brand-mark">🚌</span> BusGo</div>
        <h1>Pick a seat.<br />Pack a bag.<br />We'll handle the road.</h1>
        <p>Search routes, choose your exact seat and carry your ticket as a PDF.</p>
        
        {/* S-Curved Dotted Route Line with Forward-Facing Bus in Slow Motion */}
        <RouteLine from="Source" to="Destination" />
      </section>
      
      <section className="auth-card">
        <h2>Log in</h2>
        
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={submit} className="form">
          <label>Email<input type="email" value={form.email} onChange={set('email')} placeholder="you@example.com" required autoFocus /></label>
          <label>Password<input type="password" value={form.password} onChange={set('password')} placeholder="Your password" required /></label>
          <button className="btn btn-primary btn-block" disabled={loading}>{loading ? 'Logging in…' : 'Log in'}</button>
        </form>
        <p className="center">New to BusGo? <Link to="/register">Create a customer account</Link></p>
        <div className="quick">
          <small>Sample accounts (click to fill):</small>
          <div>
            {QUICK.map(([label, email, password]) => (
              <button key={label} type="button" className="chip" onClick={() => setForm({ email, password })}>{label}</button>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
