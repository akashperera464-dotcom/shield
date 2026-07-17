import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import SuperAdmin from './pages/SuperAdmin'
import { useAuth } from './context/AuthContext'

export default function App() {
  const { loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="relative">
          <div className="h-16 w-16 rounded-full border-2 border-brand-500/30 border-t-brand-400 animate-spin-slow" />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs font-mono text-ink-300">loading</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Animated background layers */}
      <div className="pointer-events-none fixed inset-0 -z-10 grid-backdrop" />
      <div className="pointer-events-none fixed inset-0 -z-10 aurora-blobs" />

      <Navbar />

      <main className="relative z-10">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route
            path="/dashboard/*"
            element={
              <ProtectedRoute allowRoles={['admin', 'superadmin']}>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/superadmin/*"
            element={
              <ProtectedRoute allowRoles={['superadmin']}>
                <SuperAdmin />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  )
}
