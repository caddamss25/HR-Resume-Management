import { useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'

// Pages
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Candidates from './pages/Candidates'
import CandidateDetail from './pages/CandidateDetail'
import UploadResume from './pages/UploadResume'
import SearchResults from './pages/SearchResults'
import BulkDelete from './pages/BulkDelete'
import Pipeline from './pages/Pipeline'
import CreateHR from './pages/Register'
import Settings from './pages/Settings'


// Components
import ProtectedRoute from './components/ProtectedRoute'
import Sidebar from './components/Sidebar'

function App() {
  const { isAuthenticated, loading } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  if (loading) {
    return (
      <div className="rms-spinner" style={{ minHeight: '100vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    )
  }

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen)
  const closeSidebar = () => setSidebarOpen(false)

  return (
    <>
      {isAuthenticated && (
        <>
          <div className={`rms-sidebar-overlay ${sidebarOpen ? 'open' : ''}`} onClick={closeSidebar} />
          <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />
        </>
      )}
      <div className={isAuthenticated ? 'rms-content' : ''}>
        {isAuthenticated && (
          <div className="rms-mobile-only" style={{ marginBottom: 16 }}>
            <button
              onClick={toggleSidebar}
              style={{
                background: 'var(--rms-surface)', border: '1px solid var(--rms-border)',
                color: 'var(--rms-text)', padding: '8px 12px', borderRadius: 8,
                display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.9rem'
              }}
            >
              <i className="bi bi-list" style={{ fontSize: '1.2rem' }} /> Menu
            </button>
          </div>
        )}
        <Routes>
          {/* Public */}
          <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/dashboard" replace />} />

          {/* Protected — both ADMIN and HR_RECRUITER */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/candidates" element={<Candidates />} />
            <Route path="/candidates/:id" element={<CandidateDetail />} />
            <Route path="/upload" element={<UploadResume />} />
            <Route path="/pipeline" element={<Pipeline />} />
            <Route path="/search" element={<SearchResults />} />
            <Route path="/bulk-delete" element={<BulkDelete />} />
            {/* Admin specific */}
            <Route path="/create-hr" element={<CreateHR />} />
            <Route path="/settings" element={<Settings />} />
          </Route>

          <Route path="/" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </>
  )
}

export default App
