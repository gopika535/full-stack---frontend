import axios from 'axios'

let rawUrl = import.meta.env.VITE_API_URL || 'http://localhost:8081/api'
if (rawUrl && !rawUrl.endsWith('/api') && !rawUrl.endsWith('/api/')) {
  rawUrl = rawUrl.replace(/\/+$/, '') + '/api'
}

const api = axios.create({
  baseURL: rawUrl,
})

// attach JWT to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('busgo_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// expired / invalid token -> back to login
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && !err.config.url.includes('/auth/')) {
      localStorage.removeItem('busgo_token')
      localStorage.removeItem('busgo_user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export const errMsg = (e, fallback = 'Something went wrong') =>
  e?.response?.data?.message ||
  (e?.code === 'ERR_NETWORK' ? 'Cannot reach the server. Is the backend running on port 8081?' : fallback)

export default api
