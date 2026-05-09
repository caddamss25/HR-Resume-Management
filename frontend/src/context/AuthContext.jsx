import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import api from '../api/axios'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]     = useState(null)
  const [token, setToken]   = useState(null)
  const [loading, setLoading] = useState(true)

  // Restore session on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('rms_token')
    const storedUser  = localStorage.getItem('rms_user')
    if (storedToken && storedUser) {
      setToken(storedToken)
      setUser(JSON.parse(storedUser))
    }
    setLoading(false)
  }, [])

  const login = useCallback(async (email, password) => {
    const { data } = await api.post('/api/auth/login', { email, password })
    localStorage.setItem('rms_token', data.token)
    localStorage.setItem('rms_user', JSON.stringify({
      id: data.userId, name: data.name, email: data.email, role: data.role
    }))
    setToken(data.token)
    setUser({ id: data.userId, name: data.name, email: data.email, role: data.role })
    return data
  }, [])

  const register = useCallback(async (name, email, password, role) => {
    const { data } = await api.post('/api/auth/register', { name, email, password, role })
    localStorage.setItem('rms_token', data.token)
    localStorage.setItem('rms_user', JSON.stringify({
      id: data.userId, name: data.name, email: data.email, role: data.role
    }))
    setToken(data.token)
    setUser({ id: data.userId, name: data.name, email: data.email, role: data.role })
    return data
  }, [])

  const changePassword = useCallback(async (currentPassword, newPassword) => {
    await api.post('/api/auth/change-password', { currentPassword, newPassword })
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('rms_token')
    localStorage.removeItem('rms_user')
    setToken(null)
    setUser(null)
  }, [])

  const isAuthenticated = !!token && !!user

  const hasRole = useCallback((...roles) => {
    return user && roles.includes(user.role)
  }, [user])

  return (
    <AuthContext.Provider value={{
      user, token, loading, login, register, changePassword, logout, isAuthenticated, hasRole
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}

export default AuthContext
