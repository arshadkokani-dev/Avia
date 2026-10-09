"use client";

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
  return (
    <aside className="avia-sidebar">
      <div className="avia-brand">
        <div className="avia-logo" aria-hidden="true">
          A
        </div>

        <div>
          <h1>AVIA</h1>
          <p>Personal Life OS</p>
        </div>
      </div>

      <nav className="avia-navigation" aria-label="Main navigation">
        {navigation.map((item, index) => (
          <a
            key={item.label}
            href={item.href}
            className={`avia-nav-item ${index === 0 ? "active" : ""}`}
            aria-current={index === 0 ? "page" : undefined}
          >
            <span className="avia-nav-icon" aria-hidden="true">
              {item.icon}
            </span>

            <span>{item.label}</span>
          </a>
        ))}
      </nav>

      <div className="avia-sidebar-bottom">
        <div className="avia-upgrade">
          <strong>✦ Upgrade to Pro</strong>

          <p>
            Unlock deeper insights and advanced planning.
          </p>

          <button type="button">
            Explore Pro ↗
          </button>
        </div>

        <a className="avia-settings" href="/#settings">
          <span aria-hidden="true">⚙</span>
          <span>Settings</span>
        </a>
      </div>
    </aside>
  );
}