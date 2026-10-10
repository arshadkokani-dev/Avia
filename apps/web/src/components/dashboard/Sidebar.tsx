"use client";

import { useState } from "react";
import "./Sidebar.css";

const navigation = [
{ icon: "⌂", label: "Dashboard", href: "/" },
{ icon: "◎", label: "Goals", href: "/#goals" },
{ icon: "✓", label: "Habits", href: "/#habits" },
{ icon: "▦", label: "Planning", href: "/#planning" },
{ icon: "⌁", label: "Analytics", href: "/#analytics" },
{ icon: "✎", label: "Journal", href: "/#journal" },
{ icon: "✧", label: "AI Coach", href: "/#ai-coach" },
{ icon: "▤", label: "Library", href: "/#library" },
];

export default function Sidebar() {
const [collapsed, setCollapsed] = useState(false);
const [mobileOpen, setMobileOpen] = useState(false);

return (
<>
<button
type="button"
className="avia-mobile-toggle"
onClick={() => setMobileOpen(!mobileOpen)}
aria-label={mobileOpen ? "Close navigation" : "Open navigation"}
aria-expanded={mobileOpen}
>
{mobileOpen ? "✕" : "☰"}
</button>

  {mobileOpen && (
    <button
      type="button"
      className="avia-sidebar-backdrop"
      onClick={() => setMobileOpen(false)}
      aria-label="Close navigation"
    />
  )}

  <aside
    className={`avia-sidebar ${collapsed ? "is-collapsed" : ""} ${
      mobileOpen ? "is-mobile-open" : ""
    }`}
  >
    <div className="avia-brand">
      <div className="avia-logo" aria-hidden="true">A</div>

      {!collapsed && (
        <div className="avia-brand-copy">
          <h1>AVIA</h1>
          <p>Personal Life OS</p>
        </div>
      )}

      <button
        type="button"
        className="avia-collapse-toggle"
        onClick={() => setCollapsed(!collapsed)}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        aria-expanded={!collapsed}
        title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? "›" : "‹"}
      </button>
    </div>

    <nav className="avia-navigation" aria-label="Main navigation">
      {navigation.map((item, index) => (
        <a
          key={item.label}
          href={item.href}
          title={collapsed ? item.label : undefined}
          className={`avia-nav-item ${index === 0 ? "active" : ""}`}
          aria-current={index === 0 ? "page" : undefined}
          onClick={() => setMobileOpen(false)}
        >
          <span className="avia-nav-icon" aria-hidden="true">
            {item.icon}
          </span>
          {!collapsed && <span>{item.label}</span>}
        </a>
      ))}
    </nav>

    {!collapsed && (
      <div className="avia-sidebar-bottom">
        <div className="avia-upgrade">
          <strong>✦ Upgrade to Pro</strong>
          <p>Unlock deeper insights and advanced planning.</p>
          <button type="button">Explore Pro ↗</button>
        </div>

        <a
          className="avia-settings"
          href="/#settings"
          onClick={() => setMobileOpen(false)}
        >
          <span aria-hidden="true">⚙</span>
          <span>Settings</span>
        </a>
      </div>
    )}
  </aside>
</>

);
}