"use client";

import React, { useState } from "react";
import {
  Menu,
  X,
  LogOut,
  LayoutDashboard,
  Shield,
  LogIn,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const LOGO_URL =
  "https://res.cloudinary.com/dhd06wdov/image/upload/v1784282735/ChatGPT_Image_Jul_17_2026_05_03_17_PM_adkeeh.png";

function Logo() {
  return (
    <div className="relative inline-flex h-10 w-10 shrink-0 items-center justify-center sm:h-12 sm:w-12">
      <span
        className="absolute inset-0 rounded-xl bg-mint-300/40 blur-xl animate-pulse-glow"
        aria-hidden
      />
      <img
        src={LOGO_URL}
        alt="The Shield logo"
        className="relative h-full w-full rounded-xl object-cover ring-1 ring-mint-300/30"
      />
    </div>
  );
}

export default function Navbar() {
  const {
    isAuthenticated,
    isAdmin,
    isSuperadmin,
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
      active ? "text-mint-300" : "text-ink-300 hover:text-white"
    }`;

  const goSection = (id: string) => {
    setView("home");
    setOpen(false);
    setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    }, 50);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-navy-900/95 backdrop-blur-xl">
      <nav className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-3 py-2.5 sm:px-6 sm:py-3">
        <button
          onClick={() => setView("home")}
          className="group flex min-w-0 items-center gap-2 sm:gap-4"
        >
          <Logo />
          <div className="flex min-w-0 flex-col leading-tight">
            <span className="truncate font-sans text-base font-semibold tracking-tight text-white sm:text-lg">
              The <span className="text-gradient-animated">Shield</span>
            </span>
            <span className="hidden text-[10px] uppercase tracking-[0.2em] text-mint-300/60 sm:block">
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
              {view === "dashboard" && (
                <span className="absolute -bottom-0.5 left-3 right-3 h-0.5 rounded-full bg-gradient-to-r from-mint-300 to-violet-600" />
              )}
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
              {view === "superadmin" && (
                <span className="absolute -bottom-0.5 left-3 right-3 h-0.5 rounded-full bg-gradient-to-r from-mint-300 to-violet-600" />
              )}
            </button>
          )}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          {isAuthenticated && (
            <div className="hidden lg:flex flex-col items-end leading-tight">
              <span className="text-sm font-medium text-white">
                {profile?.name || "Admin"}
              </span>
              <span className="text-[11px] uppercase tracking-wide text-mint-300">
                {profile?.role}
              </span>
            </div>
          )}

          {!isAuthenticated ? (
            <button onClick={() => setView("login")} className="btn-primary text-sm">
              <LogIn className="h-4 w-4" /> Login
            </button>
          ) : (
            <button onClick={handleLogout} className="btn-ghost text-sm" title="Log out">
              <LogOut className="h-4 w-4" /> Logout
            </button>
          )}
        </div>

        <button
          onClick={() => setOpen((o) => !o)}
          className="rounded-lg p-2 text-ink-200 hover:bg-white/5 md:hidden"
          aria-label="Toggle menu"
          aria-expanded={open}
        >
          {open ? <X className="h-5 w-5 sm:h-6 sm:w-6" /> : <Menu className="h-5 w-5 sm:h-6 sm:w-6" />}
        </button>
      </nav>

      {open && (
        <div className="border-t border-white/5 bg-navy-900/95 px-3 py-3 md:hidden animate-fade-in sm:px-6">
          <div className="flex flex-col gap-1">
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
