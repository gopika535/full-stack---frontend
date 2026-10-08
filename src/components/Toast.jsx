import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { hideToast } from '../store/uiSlice'

export default function Toast() {
  const toast = useSelector((s) => s.ui.toast)
  const dispatch = useDispatch()
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => dispatch(hideToast()), 4200)
    return () => clearTimeout(t)
  }, [toast, dispatch])
  if (!toast) return null
  return (
    <div className={`toast toast-${toast.type}`} role="status" onClick={() => dispatch(hideToast())}>
      <span>{toast.type === 'error' ? '⚠️' : '✅'}</span> {toast.text}
    </div>
  )
}
