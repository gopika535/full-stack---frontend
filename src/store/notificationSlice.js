import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api, { errMsg } from '../api/axios'

export const fetchNotifications = createAsyncThunk('notifications/fetch', async (_, { rejectWithValue }) => {
  try { return (await api.get('/notifications')).data } catch (e) { return rejectWithValue(errMsg(e)) }
})

export const markRead = createAsyncThunk('notifications/read', async (id, { rejectWithValue }) => {
  try { return (await api.put(`/notifications/${id}/read`)).data } catch (e) { return rejectWithValue(errMsg(e)) }
})

export const markAllRead = createAsyncThunk('notifications/readAll', async (_, { rejectWithValue }) => {
  try { await api.put('/notifications/read-all'); return true } catch (e) { return rejectWithValue(errMsg(e)) }
})

const slice = createSlice({
  name: 'notifications',
  initialState: { list: [], loading: false, error: null },
  reducers: {},
  extraReducers: (b) => {
    b.addCase(fetchNotifications.pending, (s) => { s.loading = true; s.error = null })
      .addCase(fetchNotifications.fulfilled, (s, a) => { s.loading = false; s.list = a.payload })
      .addCase(fetchNotifications.rejected, (s, a) => { s.loading = false; s.error = a.payload })
      .addCase(markRead.fulfilled, (s, a) => {
        const i = s.list.findIndex((n) => n.id === a.payload.id)
        if (i >= 0) s.list[i] = a.payload
      })
      .addCase(markAllRead.fulfilled, (s) => { s.list = s.list.map((n) => ({ ...n, read: true })) })
  },
})

export default slice.reducer
