import { useEffect, useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { logout } from '../store/authSlice'
import { fetchNotifications } from '../store/notificationSlice'

const NAV = {
  ADMIN: [
    ['/admin', '📊', 'Dashboard', true],
    ['/admin/operators', '🧑‍✈️', 'Operators'],
    ['/admin/buses', '🚌', 'Buses'],
    ['/admin/customers', '👥', 'Customers'],
    ['/admin/bookings', '🎫', 'Bookings'],
    ['/admin/feedback', '⭐', 'Feedback'],
  ],
  OPERATOR: [
    ['/operator', '🚌', 'My Buses', true],
    ['/operator/bookings', '🎫', 'Bookings'],
  ],
  CUSTOMER: [
    ['/customer', '🔍', 'Find Buses', true],
    ['/customer/bookings', '🎫', 'My Bookings'],
    ['/customer/notifications', '🔔', 'Notifications'],
  ],
}

export default function Layout() {
  const user = useSelector((s) => s.auth.user)
  const notifications = useSelector((s) => s.notifications.list)
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (user.role !== 'CUSTOMER') return
    dispatch(fetchNotifications())
    const t = setInterval(() => dispatch(fetchNotifications()), 30000)
    return () => clearInterval(t)
  }, [dispatch, user.role])

  const unread = notifications.filter((n) => !n.read).length
  const doLogout = () => { dispatch(logout()); navigate('/login') }

  return (
    <div className={`shell role-${user.role.toLowerCase()}`}>
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="brand"><span className="brand-mark">🚌</span> BusGo</div>
        <div className="role-chip">{user.role === 'ADMIN' ? 'Admin console' : user.role === 'OPERATOR' ? 'Operator desk' : 'Traveller'}</div>
        <nav onClick={() => setOpen(false)}>
          {NAV[user.role].map(([to, icon, label, end]) => (
            <NavLink key={to} to={to} end={!!end} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <span className="nav-icon">{icon}</span>
              <span>{label}</span>
              {label === 'Notifications' && unread > 0 && <span className="count-pill">{unread}</span>}
            </NavLink>
          ))}
        </nav>
        <button className="nav-link logout" onClick={doLogout}><span className="nav-icon">🚪</span> Log out</button>
      </aside>
      {open && <div className="scrim" onClick={() => setOpen(false)} />}
      <div className="main">
        <header className="topbar">
          <button className="icon-btn menu-btn" onClick={() => setOpen(true)} aria-label="Open menu">☰</button>
          <div className="topbar-title">Welcome, <strong>{user.name}</strong></div>
          <div className="user-chip">
            <span className="avatar">{user.name.charAt(0).toUpperCase()}</span>
            <span className="user-meta"><b>{user.name}</b><small>{user.email}</small></span>
          </div>
        </header>
        <main className="content"><Outlet /></main>
      </div>
    </div>
  )
}
