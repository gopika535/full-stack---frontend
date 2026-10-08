import { Navigate, Route, Routes } from 'react-router-dom'
import { useSelector } from 'react-redux'
import Layout from './components/Layout'
import Toast from './components/Toast'
import ProtectedRoute, { homeFor } from './components/ProtectedRoute'
import Login from './pages/Login'
import Register from './pages/Register'
import AdminDashboard from './pages/admin/Dashboard'
import AdminOperators from './pages/admin/Operators'
import AdminBuses from './pages/admin/Buses'
import AdminCustomers from './pages/admin/Customers'
import AdminBookings from './pages/admin/Bookings'
import AdminFeedback from './pages/admin/Feedback'
import OperatorBuses from './pages/operator/MyBuses'
import OperatorBusDetail from './pages/operator/BusDetail'
import OperatorBookings from './pages/operator/Bookings'
import FindBuses from './pages/customer/FindBuses'
import SeatSelection from './pages/customer/SeatSelection'
import Checkout from './pages/customer/Checkout'
import MyBookings from './pages/customer/MyBookings'
import Notifications from './pages/customer/Notifications'

const Guard = ({ role }) => (
  <ProtectedRoute role={role}><Layout /></ProtectedRoute>
)

export default function App() {
  const user = useSelector((s) => s.auth.user)
  return (
    <>
      <Routes>
        <Route path="/" element={<Navigate to={user ? homeFor(user.role) : '/login'} replace />} />
        <Route path="/login" element={user ? <Navigate to={homeFor(user.role)} replace /> : <Login />} />
        <Route path="/register" element={user ? <Navigate to={homeFor(user.role)} replace /> : <Register />} />

        <Route path="/admin" element={<Guard role="ADMIN" />}>
          <Route index element={<AdminDashboard />} />
          <Route path="operators" element={<AdminOperators />} />
          <Route path="buses" element={<AdminBuses />} />
          <Route path="customers" element={<AdminCustomers />} />
          <Route path="bookings" element={<AdminBookings />} />
          <Route path="feedback" element={<AdminFeedback />} />
        </Route>

        <Route path="/operator" element={<Guard role="OPERATOR" />}>
          <Route index element={<OperatorBuses />} />
          <Route path="bus/:id" element={<OperatorBusDetail />} />
          <Route path="bookings" element={<OperatorBookings />} />
        </Route>

        <Route path="/customer" element={<Guard role="CUSTOMER" />}>
          <Route index element={<FindBuses />} />
          <Route path="bus/:id" element={<SeatSelection />} />
          <Route path="checkout" element={<Checkout />} />
          <Route path="bookings" element={<MyBookings />} />
          <Route path="notifications" element={<Notifications />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toast />
    </>
  )
}
