import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api, { errMsg } from '../api/axios'

const saved = () => {
  try { return JSON.parse(localStorage.getItem('busgo_user')) } catch { return null }
}

const persist = (data) => {
  localStorage.setItem('busgo_token', data.token)
  localStorage.setItem('busgo_user', JSON.stringify(data))
}

export const login = createAsyncThunk('auth/login', async (body, { rejectWithValue }) => {
  try { const { data } = await api.post('/auth/login', body); persist(data); return data }
  catch (e) { return rejectWithValue(errMsg(e, 'Login failed')) }
})

export const register = createAsyncThunk('auth/register', async (body, { rejectWithValue }) => {
  try { const { data } = await api.post('/auth/register', body); return data }
  catch (e) { return rejectWithValue(errMsg(e, 'Registration failed')) }
})

const authSlice = createSlice({
  name: 'auth',
  initialState: { user: saved(), loading: false, error: null },
  reducers: {
    logout(state) {
      state.user = null
      localStorage.removeItem('busgo_token')
      localStorage.removeItem('busgo_user')
    },
    clearError(state) { state.error = null },
  },
  extraReducers: (b) => {
    b.addCase(login.pending, (s) => { s.loading = true; s.error = null })
      .addCase(login.fulfilled, (s, a) => { s.loading = false; s.user = a.payload })
      .addCase(login.rejected, (s, a) => { s.loading = false; s.error = a.payload })
      .addCase(register.pending, (s) => { s.loading = true; s.error = null })
      .addCase(register.fulfilled, (s) => { s.loading = false })
      .addCase(register.rejected, (s, a) => { s.loading = false; s.error = a.payload })
  },
})

export const { logout, clearError } = authSlice.actions
export default authSlice.reducer
