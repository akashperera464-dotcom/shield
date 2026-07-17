/**
 * ProtectedRoute — wraps any admin/superadmin route.
 *
 * Behaviour:
 *   • If the user is not authenticated → redirect to /login.
 *   • If the user is authenticated but has no `users/uid` document (role === null)
 *     → show "Contact superadmin" screen (they logged in but aren't authorised).
 *   • If the user has a role not in `allowRoles` → show "403 forbidden" screen.
 *   • Otherwise → render the wrapped children.
 *
 * Usage:
 *   <ProtectedRoute allowRoles={['admin','superadmin']}>
 *     <Dashboard />
 *   </ProtectedRoute>
 */
import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Lock, ShieldAlert, UserX } from 'lucide-react'

export default function ProtectedRoute({ allowRoles = [], children }) {
  const { isAuthenticated, role, profile } = useAuth()

  // 1. Not logged in
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  // 2. Logged in but no role document in `users/uid`
  if (!role) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-6">
        <div className="glass-card max-w-md p-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/15 ring-1 ring-amber-500/30">
            <UserX className="h-7 w-7 text-amber-300" />
          </div>
          <h2 className="font-display text-2xl font-semibold text-white">
            Account not authorised
          </h2>
          <p className="mt-2 text-sm text-ink-300">
            Your Firebase account exists but no role was found in the{' '}
            <code className="rounded bg-white/5 px-1.5 py-0.5 text-ink-200">users</code>{' '}
            collection. Please ask the <span className="text-brand-300">Superadmin</span> to
            create your role document.
          </p>
        </div>
      </div>
    )
  }

  // 3. Role not allowed
  if (!allowRoles.includes(role)) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-6">
        <div className="glass-card max-w-md p-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-rose-500/15 ring-1 ring-rose-500/30">
            <ShieldAlert className="h-7 w-7 text-rose-300" />
          </div>
          <h2 className="font-display text-2xl font-semibold text-white">
            Access denied
          </h2>
          <p className="mt-2 text-sm text-ink-300">
            Your role (<span className="font-mono text-rose-300">{role}</span>) doesn't have
            permission to view this page.
          </p>
        </div>
      </div>
    )
  }

  // 4. Allow
  return <>{children}</>
}
