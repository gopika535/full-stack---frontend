import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api, { errMsg } from '../api/axios'

export const fetchBuses = createAsyncThunk('buses/fetchAll', async (_, { rejectWithValue }) => {
  try { return (await api.get('/buses')).data } catch (e) { return rejectWithValue(errMsg(e)) }
})

export const searchBuses = createAsyncThunk('buses/search', async (params, { rejectWithValue }) => {
  try {
    const q = {}
    if (params.from) q.from = params.from
    if (params.to) q.to = params.to
    if (params.date) q.date = params.date
    return (await api.get('/buses/search', { params: q })).data
  } catch (e) { return rejectWithValue(errMsg(e)) }
})

export const fetchBus = createAsyncThunk('buses/fetchOne', async (id, { rejectWithValue }) => {
  try { return (await api.get(`/buses/${id}`)).data } catch (e) { return rejectWithValue(errMsg(e)) }
})

export const fetchOperatorBuses = createAsyncThunk('buses/operatorList', async (_, { rejectWithValue }) => {
  try { return (await api.get('/operator/buses')).data } catch (e) { return rejectWithValue(errMsg(e)) }
})

export const fetchOperatorBusDetail = createAsyncThunk('buses/operatorDetail', async (id, { rejectWithValue }) => {
  try { return (await api.get(`/operator/buses/${id}`)).data } catch (e) { return rejectWithValue(errMsg(e)) }
})

const busSlice = createSlice({
  name: 'buses',
  initialState: { list: [], current: null, operatorDetail: null, loading: false, error: null },
  reducers: { clearCurrent(s) { s.current = null; s.operatorDetail = null; s.error = null } },
  extraReducers: (b) => {
    const list = (thunk) =>
      b.addCase(thunk.pending, (s) => { s.loading = true; s.error = null })
        .addCase(thunk.fulfilled, (s, a) => { s.loading = false; s.list = a.payload })
        .addCase(thunk.rejected, (s, a) => { s.loading = false; s.error = a.payload })
    list(fetchBuses); list(searchBuses); list(fetchOperatorBuses)
    b.addCase(fetchBus.pending, (s) => { s.loading = true; s.error = null; s.current = null })
      .addCase(fetchBus.fulfilled, (s, a) => { s.loading = false; s.current = a.payload })
      .addCase(fetchBus.rejected, (s, a) => { s.loading = false; s.error = a.payload })
      .addCase(fetchOperatorBusDetail.pending, (s) => { s.loading = true; s.error = null; s.operatorDetail = null })
      .addCase(fetchOperatorBusDetail.fulfilled, (s, a) => { s.loading = false; s.operatorDetail = a.payload })
      .addCase(fetchOperatorBusDetail.rejected, (s, a) => { s.loading = false; s.error = a.payload })
  },
})

export const { clearCurrent } = busSlice.actions
export default busSlice.reducer
