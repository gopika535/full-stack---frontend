import { Navigate, useLocation } from 'react-router-dom'
import { useSelector } from 'react-redux'

export const homeFor = (role) =>
  role === 'ADMIN' ? '/admin' : role === 'OPERATOR' ? '/operator' : '/customer'

export default function ProtectedRoute({ role, children }) {
  const user = useSelector((s) => s.auth.user)
  const location = useLocation()
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />
  if (role && user.role !== role) return <Navigate to={homeFor(user.role)} replace />
  return children
}
