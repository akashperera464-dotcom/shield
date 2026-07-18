"use client";

import { AuthProvider, useAuth } from "@/context/AuthContext";
import Navbar from "@/components/devforge/Navbar";
import HomeView from "@/components/devforge/HomeView";
import LoginView from "@/components/devforge/LoginView";
import DashboardView from "@/components/devforge/DashboardView";
import SuperAdminView from "@/components/devforge/SuperAdminView";
import ScrollProgress from "@/components/devforge/ScrollProgress";

function Shell() {
  const { view, isAuthenticated, isAdmin, isSuperadmin, loading } = useAuth();

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
    );
  }

  // Route guard: protected views require auth + role
  const renderView = () => {
    if (view === "login") return <LoginView />;

    if (view === "dashboard") {
      if (!isAuthenticated || !isAdmin) return <LoginView />;
      return <DashboardView />;
    }

    if (view === "superadmin") {
      if (!isAuthenticated || !isSuperadmin) return <LoginView />;
      return <SuperAdminView />;
    }

    return <HomeView />;
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Animated background layers — aurora blobs + dot grid */}
      <div className="aurora-stage">
        <div className="aurora-blob aurora-blob-1" />
        <div className="aurora-blob aurora-blob-2" />
        <div className="aurora-blob aurora-blob-3" />
      </div>
      <div className="pointer-events-none fixed inset-0 -z-10 grid-backdrop" />

      {/* Top-of-page scroll progress bar (home + login only — admin pages
          have their own scroll containers) */}
      {(view === "home" || view === "login") && <ScrollProgress />}

      <Navbar />
      {/* key forces remount → view-fade animation runs on every view change */}
      <main key={view} className="relative z-10 view-fade">
        {renderView()}
      </main>
    </div>
  );
}

export default function Home() {
  return (
    <AuthProvider>
      <Shell />
    </AuthProvider>
  );
}
