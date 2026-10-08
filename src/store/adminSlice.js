import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api, { errMsg } from '../api/axios'

const get = (name, url, key) => ({
  thunk: createAsyncThunk(`admin/${name}`, async (_, { rejectWithValue }) => {
    try { return (await api.get(url)).data } catch (e) { return rejectWithValue(errMsg(e)) }
  }),
  key,
})

const stats = get('stats', '/admin/stats', 'stats')
const customers = get('customers', '/admin/users', 'customers')
const operators = get('operators', '/admin/operators', 'operators')
const bookings = get('bookings', '/admin/bookings', 'bookings')
const feedback = get('feedback', '/admin/feedback', 'feedback')

export const fetchStats = stats.thunk
export const fetchCustomers = customers.thunk
export const fetchOperators = operators.thunk
export const fetchAllBookings = bookings.thunk
export const fetchFeedback = feedback.thunk

const slice = createSlice({
  name: 'admin',
  initialState: { stats: null, customers: [], operators: [], bookings: [], feedback: [], loading: false, error: null },
  reducers: {},
  extraReducers: (b) => {
    ;[stats, customers, operators, bookings, feedback].forEach(({ thunk, key }) => {
      b.addCase(thunk.pending, (s) => { s.loading = true; s.error = null })
        .addCase(thunk.fulfilled, (s, a) => { s.loading = false; s[key] = a.payload })
        .addCase(thunk.rejected, (s, a) => { s.loading = false; s.error = a.payload })
    })
  },
})

export default slice.reducer
