"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "../../src/components/auth/AuthProvider";
import "./settings.css";

export default function SettingsPage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.replace("/login");
  };

  if (loading) {
    return (
      <main className="settings-page">
        <p className="settings-loading">Loading your settings...</p>
      </main>
    );
  }

  return (
    <main className="settings-page">
      <header className="settings-header">
        <div>
          <span className="settings-eyebrow">ACCOUNT & PREFERENCES</span>
          <h1>Settings</h1>
          <p>Manage your account and understand your privacy controls.</p>
        </div>
      </header>

      <section className="settings-section">
        <div className="settings-section-heading">
          <h2>Account information</h2>
          <p>Your registered AVIA account details.</p>
        </div>

        <div className="settings-card">
          <div className="settings-profile">
            <div className="settings-avatar">
              {user?.name?.charAt(0).toUpperCase() || "A"}
            </div>
            <div>
              <strong>{user?.name || "AVIA User"}</strong>
              <span>Personal account</span>
            </div>
          </div>

          <div className="settings-fields">
            <div className="settings-field">
              <span>Full name</span>
              <strong>{user?.name || "Not available"}</strong>
            </div>

            <div className="settings-field">
              <span>Email address</span>
              <strong>{user?.email || "Not available"}</strong>
            </div>

            <div className="settings-field">
              <span>Account type</span>
              <strong>Free plan</strong>
            </div>
          </div>

          <p className="settings-note">
            Profile editing and account management options will be added
            in a future update.
          </p>
        </div>
      </section>

      <section className="settings-section">
        <div className="settings-section-heading">
          <h2>Privacy & AI Coach</h2>
          <p>Understand how your personal information is used.</p>
        </div>

        <div className="settings-card settings-privacy">
          <div>
            <strong>Personal AVIA context</strong>
            <p>
              The AI Coach can use your goals, habits and weekly plans
              to provide relevant recommendations.
            </p>
          </div>

          <div>
            <strong>Journal privacy</strong>
            <p>
              Your journal entries are excluded from AI Coach requests
              by default. You must explicitly enable journal access
              using the checkbox in each message.
            </p>
          </div>

          <div>
            <strong>Account security</strong>
            <p>
              Your account uses authenticated sessions to protect
              access to your personal AVIA data.
            </p>
          </div>

          <button
            type="button"
            className="settings-secondary-button"
            onClick={() => router.push("/ai-coach")}
          >
            Open AI Coach ↗
          </button>
        </div>
      </section>

      <section className="settings-section">
        <div className="settings-section-heading">
          <h2>Subscription</h2>
          <p>Manage your current plan and explore premium features.</p>
        </div>

        <div className="settings-card settings-subscription">
          <div>
            <span className="settings-plan-label">CURRENT PLAN</span>
            <h3>AVIA Free</h3>
            <p>
              You currently have access to the available core
              AVIA features.
            </p>
          </div>

          <button
            type="button"
            className="settings-primary-button"
            onClick={() => router.push("/upgrade")}
          >
            Explore AVIA Pro ↗
          </button>
        </div>
      </section>

      <section className="settings-section">
        <div className="settings-section-heading">
          <h2>Session</h2>
          <p>Sign out of your current account.</p>
        </div>

        <div className="settings-card settings-session">
          <div>
            <strong>Log out</strong>
            <p>
              Your current session will end. You can sign in again
              whenever you want.
            </p>
          </div>

          <button
            type="button"
            className="settings-logout-button"
            onClick={handleLogout}
          >
            Log out
          </button>
        </div>
      </section>

      <p className="settings-footer">
        AVIA · Personal Life OS
      </p>
    </main>
  );
}