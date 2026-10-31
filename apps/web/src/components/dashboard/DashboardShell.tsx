"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Sidebar from "./Sidebar";
import { useAuth } from "../auth/AuthProvider";

export default function DashboardShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading } = useAuth();

  const isAuthPage =
    pathname === "/login" || pathname === "/signup";

  // Redirect visitors who are not authenticated.
  useEffect(() => {
    if (!loading && !user && !isAuthPage) {
      router.replace("/login");
    }
  }, [loading, user, isAuthPage, router]);

  // Redirect authenticated users away from login and signup.
  useEffect(() => {
    if (!loading && user && isAuthPage) {
      router.replace("/");
    }
  }, [loading, user, isAuthPage, router]);

  if (loading) {
    return (
      <div className="avia-auth-loading">
        <span>AVIA</span>
        <p>Restoring your session...</p>
      </div>
    );
  }

  if (isAuthPage) {
    return <>{children}</>;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="avia-app-shell">
      <Sidebar />
      <main className="avia-main">{children}</main>
    </div>
  );
}