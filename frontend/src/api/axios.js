import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080',
  headers: {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true' // Add this line
  }
})


// Request interceptor — attach JWT token to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('rms_token')
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor — handle 401 globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isLoginRequest = error.config?.url?.includes('/api/auth/login')
    if (error.response?.status === 401 && !isLoginRequest) {
      localStorage.removeItem('rms_token')
      localStorage.removeItem('rms_user')
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default api
