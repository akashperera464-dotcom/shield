"use client";

import { AuthProvider, useAuth } from "@/context/AuthContext";
import Navbar from "@/components/devforge/Navbar";
import HomeView from "@/components/devforge/HomeView";
import LoginView from "@/components/devforge/LoginView";
import DashboardView from "@/components/devforge/DashboardView";
import SuperAdminView from "@/components/devforge/SuperAdminView";

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
      {/* Animated background layers */}
      <div className="pointer-events-none fixed inset-0 -z-10 grid-backdrop" />
      <div className="pointer-events-none fixed inset-0 -z-10 aurora-blobs" />

      <Navbar />
      <main className="relative z-10">{renderView()}</main>
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
