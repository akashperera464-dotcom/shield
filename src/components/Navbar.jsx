import React, { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { Menu, X, LogOut, LayoutDashboard, Shield, Sparkles } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import Logo from './Logo'

export default function Navbar() {
  const { isAuthenticated, isAdmin, isSuperadmin, logout, profile } = useAuth()
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/')
    setOpen(false)
  }

  const navLinkClass = ({ isActive }) =>
    `relative px-3 py-2 text-sm font-medium transition-colors duration-200 ${
      isActive ? 'text-white' : 'text-ink-300 hover:text-white'
    }`

  return (
    <header className="sticky top-0 z-50 border-b border-white/5 bg-ink-950/70 backdrop-blur-xl">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
        {/* Brand */}
        <Link to="/" className="group flex items-center gap-3">
          <Logo size={36} />
          <div className="flex flex-col leading-tight">
            <span className="font-display text-lg font-semibold tracking-tight text-white">
              Dev<span className="text-gradient-animated">Forge</span>
            </span>
            <span className="text-[10px] uppercase tracking-[0.2em] text-ink-400">
              Software Agency
            </span>
          </div>
        </Link>

        {/* Desktop links */}
        <div className="hidden items-center gap-1 md:flex">
          <NavLink to="/" className={navLinkClass} end>
            Home
          </NavLink>
          <NavLink to="/#submit" className={navLinkClass}>
            Submit Project
          </NavLink>
          <NavLink to="/#track" className={navLinkClass}>
            Track Status
          </NavLink>
          {isAuthenticated && isAdmin && (
            <NavLink to="/dashboard" className={navLinkClass}>
              <span className="inline-flex items-center gap-1.5">
                <LayoutDashboard className="h-4 w-4" /> Dashboard
              </span>
            </NavLink>
          )}
          {isAuthenticated && isSuperadmin && (
            <NavLink to="/superadmin" className={navLinkClass}>
              <span className="inline-flex items-center gap-1.5">
                <Shield className="h-4 w-4" /> Superadmin
              </span>
            </NavLink>
          )}
        </div>

        {/* CTA / Auth */}
        <div className="hidden items-center gap-3 md:flex">
          {!isAuthenticated ? (
            <Link to="/login" className="btn-primary text-sm">
              <Sparkles className="h-4 w-4" /> Admin Login
            </Link>
          ) : (
            <div className="flex items-center gap-3">
              <div className="hidden lg:flex flex-col items-end leading-tight">
                <span className="text-sm font-medium text-white">{profile?.name || 'Admin'}</span>
                <span className="text-[11px] uppercase tracking-wide text-brand-300">{profile?.role}</span>
              </div>
              <button onClick={handleLogout} className="btn-ghost text-sm" title="Log out">
                <LogOut className="h-4 w-4" /> Logout
              </button>
            </div>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          onClick={() => setOpen((o) => !o)}
          className="rounded-lg p-2 text-ink-200 hover:bg-white/5 md:hidden"
          aria-label="Toggle menu"
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </nav>

      {/* Mobile menu */}
      {open && (
        <div className="border-t border-white/5 bg-ink-950/95 px-6 py-4 md:hidden animate-fade-in">
          <div className="flex flex-col gap-2">
            <NavLink to="/" end onClick={() => setOpen(false)} className="rounded-lg px-3 py-2 text-ink-200 hover:bg-white/5">
              Home
            </NavLink>
            <a href="/#submit" onClick={() => setOpen(false)} className="rounded-lg px-3 py-2 text-ink-200 hover:bg-white/5">
              Submit Project
            </a>
            <a href="/#track" onClick={() => setOpen(false)} className="rounded-lg px-3 py-2 text-ink-200 hover:bg-white/5">
              Track Status
            </a>
            {isAuthenticated && isAdmin && (
              <NavLink to="/dashboard" onClick={() => setOpen(false)} className="rounded-lg px-3 py-2 text-ink-200 hover:bg-white/5">
                Dashboard
              </NavLink>
            )}
            {isAuthenticated && isSuperadmin && (
              <NavLink to="/superadmin" onClick={() => setOpen(false)} className="rounded-lg px-3 py-2 text-ink-200 hover:bg-white/5">
                Superadmin
              </NavLink>
            )}
            <div className="my-2 h-px bg-white/5" />
            {!isAuthenticated ? (
              <Link to="/login" onClick={() => setOpen(false)} className="btn-primary text-sm w-full">
                Admin Login
              </Link>
            ) : (
              <button onClick={handleLogout} className="btn-ghost text-sm w-full">
                <LogOut className="h-4 w-4" /> Logout
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
