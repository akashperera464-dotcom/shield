"use client";

import React, { useState } from "react";
import {
  Menu,
  X,
  LogOut,
  LayoutDashboard,
  Shield,
  LogIn,
  FlaskConical,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const LOGO_URL =
  "https://res.cloudinary.com/dhd06wdov/image/upload/v1784282735/ChatGPT_Image_Jul_17_2026_05_03_17_PM_adkeeh.png";

function Logo({ size = 36 }: { size?: number }) {
  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <span
        className="absolute inset-0 rounded-xl bg-brand-500/40 blur-xl animate-pulse-glow"
        aria-hidden
      />
      <img
        src={LOGO_URL}
        alt="DevForge logo"
        className="relative h-full w-full rounded-xl object-cover ring-1 ring-white/15"
        style={{ width: size, height: size }}
      />
    </div>
  );
}

export default function Navbar() {
  const {
    isAuthenticated,
    isAdmin,
    isSuperadmin,
    isDemo,
    logout,
    profile,
    view,
    setView,
  } = useAuth();
  const [open, setOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    setOpen(false);
  };

  const navBtn = (active: boolean) =>
    `relative px-3 py-2 text-sm font-medium transition-colors duration-200 ${
      active ? "text-white" : "text-ink-300 hover:text-white"
    }`;

  const goSection = (id: string) => {
    setView("home");
    setOpen(false);
    setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    }, 50);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-white/5 bg-ink-950/70 backdrop-blur-xl">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
        <button
          onClick={() => setView("home")}
          className="group flex items-center gap-3"
        >
          <Logo size={36} />
          <div className="flex flex-col leading-tight">
            <span className="font-sans text-lg font-semibold tracking-tight text-white">
              Dev<span className="text-gradient-animated">Forge</span>
            </span>
            <span className="text-[10px] uppercase tracking-[0.2em] text-ink-400">
              Software Agency
            </span>
          </div>
        </button>

        <div className="hidden items-center gap-1 md:flex">
          <button onClick={() => setView("home")} className={navBtn(view === "home")}>
            Home
          </button>
          <button onClick={() => goSection("services")} className={navBtn(false)}>
            Services
          </button>
          <button onClick={() => goSection("process")} className={navBtn(false)}>
            Process
          </button>
          <button onClick={() => goSection("submit")} className={navBtn(false)}>
            Submit Project
          </button>
          <button onClick={() => goSection("track")} className={navBtn(false)}>
            Track Status
          </button>

          {isAuthenticated && isAdmin && (
            <button
              onClick={() => setView("dashboard")}
              className={navBtn(view === "dashboard")}
            >
              <span className="inline-flex items-center gap-1.5">
                <LayoutDashboard className="h-4 w-4" /> Dashboard
              </span>
            </button>
          )}
          {isAuthenticated && isSuperadmin && (
            <button
              onClick={() => setView("superadmin")}
              className={navBtn(view === "superadmin")}
            >
              <span className="inline-flex items-center gap-1.5">
                <Shield className="h-4 w-4" /> Superadmin
              </span>
            </button>
          )}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          {isAuthenticated && isDemo && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/30 bg-amber-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-amber-300">
              <FlaskConical className="h-3 w-3" /> Demo
            </span>
          )}

          {!isAuthenticated ? (
            <button onClick={() => setView("login")} className="btn-primary text-sm">
              <LogIn className="h-4 w-4" /> Login
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <div className="hidden lg:flex flex-col items-end leading-tight">
                <span className="text-sm font-medium text-white">
                  {profile?.name || "Admin"}
                </span>
                <span className="text-[11px] uppercase tracking-wide text-brand-300">
                  {profile?.role}
                </span>
              </div>
              <button onClick={handleLogout} className="btn-ghost text-sm" title="Log out">
                <LogOut className="h-4 w-4" /> Logout
              </button>
            </div>
          )}
        </div>

        <button
          onClick={() => setOpen((o) => !o)}
          className="rounded-lg p-2 text-ink-200 hover:bg-white/5 md:hidden"
          aria-label="Toggle menu"
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </nav>

      {open && (
        <div className="border-t border-white/5 bg-ink-950/95 px-6 py-4 md:hidden animate-fade-in">
          <div className="flex flex-col gap-2">
            <button onClick={() => { setView("home"); setOpen(false); }} className="rounded-lg px-3 py-2 text-left text-ink-200 hover:bg-white/5">
              Home
            </button>
            <button onClick={() => goSection("services")} className="rounded-lg px-3 py-2 text-left text-ink-200 hover:bg-white/5">
              Services
            </button>
            <button onClick={() => goSection("process")} className="rounded-lg px-3 py-2 text-left text-ink-200 hover:bg-white/5">
              Process
            </button>
            <button onClick={() => goSection("submit")} className="rounded-lg px-3 py-2 text-left text-ink-200 hover:bg-white/5">
              Submit Project
            </button>
            <button onClick={() => goSection("track")} className="rounded-lg px-3 py-2 text-left text-ink-200 hover:bg-white/5">
              Track Status
            </button>
            {isAuthenticated && isAdmin && (
              <button onClick={() => { setView("dashboard"); setOpen(false); }} className="rounded-lg px-3 py-2 text-left text-ink-200 hover:bg-white/5">
                Dashboard
              </button>
            )}
            {isAuthenticated && isSuperadmin && (
              <button onClick={() => { setView("superadmin"); setOpen(false); }} className="rounded-lg px-3 py-2 text-left text-ink-200 hover:bg-white/5">
                Superadmin
              </button>
            )}
            <div className="my-2 h-px bg-white/5" />
            {!isAuthenticated ? (
              <button onClick={() => { setView("login"); setOpen(false); }} className="btn-primary text-sm w-full">
                <LogIn className="h-4 w-4" /> Login
              </button>
            ) : (
              <button onClick={handleLogout} className="btn-ghost text-sm w-full">
                <LogOut className="h-4 w-4" /> Logout
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
