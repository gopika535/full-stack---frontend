import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchNotifications, markRead, markAllRead } from '../../store/notificationSlice'
import { Loading, Empty, ErrorBox } from '../../components/State'
import { fmtDateTime } from '../../utils/format'

const ICON = { BOOKING_CONFIRMED: '🎫', BUS_CANCELLED: '🚫', BUS_UPDATED: '🕒', JOURNEY_REMINDER: '⏰' }

export default function Notifications() {
  const dispatch = useDispatch()
  const { list, loading, error } = useSelector((s) => s.notifications)
  const load = () => dispatch(fetchNotifications())
  useEffect(() => { load() }, [])
  const unread = list.filter((n) => !n.read).length

  return (
    <>
      <div className="page-head">
        <div><h1>Notifications</h1><p className="muted">Booking confirmations, journey reminders and updates.</p></div>
        {unread > 0 && <button className="btn btn-ghost" onClick={() => dispatch(markAllRead())}>Mark all as read</button>}
      </div>
      <ErrorBox message={error} onRetry={load} />
      {loading && !list.length ? <Loading /> : !list.length ? (
        <Empty icon="🔔" title="You're all caught up" hint="New booking, reminder and cancellation alerts will show up here." />
      ) : (
        <div className="stack">
          {list.map((n) => (
            <button key={n.id} className={`panel notif ${n.read ? '' : 'unread'} ${n.type === 'BUS_CANCELLED' ? 'danger' : ''} ${n.type === 'JOURNEY_REMINDER' ? 'reminder' : ''}`}
              onClick={() => !n.read && dispatch(markRead(n.id))}>
              <span className="notif-icon">{ICON[n.type] || '🔔'}</span>
              <span className="notif-body">
                <b>{n.message}</b>
                {n.details && <small style={{ whiteSpace: 'pre-line', lineHeight: '1.45', margin: '0.25rem 0' }}>{n.details}</small>}
                <small className="muted">{fmtDateTime(n.createdAt)}</small>
              </span>
              {!n.read && <span className="dot" aria-label="unread" />}
            </button>
          ))}
        </div>
      )}
    </>
  )
}
