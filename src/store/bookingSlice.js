import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api, { errMsg } from '../api/axios'

export const fetchMyBookings = createAsyncThunk('bookings/my', async (_, { rejectWithValue }) => {
  try { return (await api.get('/bookings/my')).data } catch (e) { return rejectWithValue(errMsg(e)) }
})

export const createBooking = createAsyncThunk('bookings/create', async (body, { rejectWithValue }) => {
  try { return (await api.post('/bookings', body)).data } catch (e) { return rejectWithValue(errMsg(e, 'Booking failed')) }
})

export const submitFeedback = createAsyncThunk('bookings/feedback', async (body, { rejectWithValue }) => {
  try { return (await api.post('/feedback', body)).data } catch (e) { return rejectWithValue(errMsg(e, 'Could not save feedback')) }
})

export const cancelBooking = createAsyncThunk('bookings/cancel', async (arg, { rejectWithValue }) => {
  try {
    const isObj = typeof arg === 'object' && arg !== null
    const bookingId = isObj ? arg.bookingId : arg
    const body = isObj ? { seatNumbers: arg.seatNumbers, ticketCount: arg.ticketCount } : {}
    return (await api.put(`/bookings/${bookingId}/cancel`, body)).data
  } catch (e) {
    return rejectWithValue(errMsg(e, 'Could not cancel ticket'))
  }
})

const bookingSlice = createSlice({
  name: 'bookings',
  initialState: {
    mine: [], loading: false, error: null,
    draft: null,        // { bus, seats, pickupPoint, dropPoint, paidVia }
    confirmed: null,    // booking returned by the API after Confirm
    submitting: false,
  },
  reducers: {
    setDraft(s, { payload }) { s.draft = { ...s.draft, ...payload }; s.confirmed = null },
    clearDraft(s) { s.draft = null },
    clearConfirmed(s) { s.confirmed = null },
  },
  extraReducers: (b) => {
    b.addCase(fetchMyBookings.pending, (s) => { s.loading = true; s.error = null })
      .addCase(fetchMyBookings.fulfilled, (s, a) => { s.loading = false; s.mine = a.payload })
      .addCase(fetchMyBookings.rejected, (s, a) => { s.loading = false; s.error = a.payload })
      .addCase(createBooking.pending, (s) => { s.submitting = true })
      .addCase(createBooking.fulfilled, (s, a) => {
        s.submitting = false
        s.confirmed = {
          ...a.payload,
          pickupPoint: s.draft?.pickupPoint,
          dropPoint: s.draft?.dropPoint,
          paidVia: s.draft?.paidVia,
        }
        s.draft = null
      })
      .addCase(createBooking.rejected, (s) => { s.submitting = false })
      .addCase(cancelBooking.fulfilled, (s, a) => {
        s.mine = s.mine.map((x) => (x.id === a.payload.id ? a.payload : x))
        if (s.confirmed?.id === a.payload.id) {
          s.confirmed = a.payload
        }
      })
  },
})

export const { setDraft, clearDraft, clearConfirmed } = bookingSlice.actions
export default bookingSlice.reducer
