"use client";

import Sidebar from "./Sidebar";

export default function DashboardShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="avia-app-shell">
      <Sidebar />
      <main className="avia-main">{children}</main>
    </div>
  );
}