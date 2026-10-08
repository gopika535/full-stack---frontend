import { createSlice } from '@reduxjs/toolkit'

// global toast message
const uiSlice = createSlice({
  name: 'ui',
  initialState: { toast: null },
  reducers: {
    showToast(state, { payload }) {
      state.toast = { id: Date.now(), type: payload.type || 'success', text: payload.text }
    },
    hideToast(state) { state.toast = null },
  },
})

export const { showToast, hideToast } = uiSlice.actions
export default uiSlice.reducer
