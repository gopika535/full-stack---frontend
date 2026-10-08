import { configureStore } from '@reduxjs/toolkit'
import auth from './authSlice'
import ui from './uiSlice'
import buses from './busSlice'
import bookings from './bookingSlice'
import notifications from './notificationSlice'
import admin from './adminSlice'

export const store = configureStore({
  reducer: { auth, ui, buses, bookings, notifications, admin },
})
