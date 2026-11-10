"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../../src/components/auth/AuthProvider";
import "./settings.css";

export default function SettingsPage() {
  const { user, loading, logout, updateProfile } = useAuth();
  const router = useRouter();

  const [emailCopied, setEmailCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [profileSuccess, setProfileSuccess] = useState("");

  // Keep the form synchronized with the authenticated user.
  useEffect(() => {
    setName(user?.name || "");
  }, [user?.name]);

  const handleCopyEmail = async () => {
    if (!user?.email) return;

    try {
      await navigator.clipboard.writeText(user.email);
      setEmailCopied(true);
      window.setTimeout(() => setEmailCopied(false), 1800);
    } catch {
      setEmailCopied(false);
    }
  };

  const handleEditProfile = () => {
    setName(user?.name || "");
    setProfileError("");
    setProfileSuccess("");
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setName(user?.name || "");
    setProfileError("");
    setIsEditing(false);
  };

  const handleSaveProfile = async () => {
    const trimmedName = name.trim();

    if (!trimmedName) {
      setProfileError("Please enter your name.");
      return;
    }

    if (trimmedName.length > 60) {
      setProfileError("Name cannot exceed 60 characters.");
      return;
    }

    if (trimmedName === user?.name) {
      setIsEditing(false);
      setProfileError("");
      return;
    }

    try {
      setSaving(true);
      setProfileError("");
      setProfileSuccess("");

      await updateProfile(trimmedName);

      setName(trimmedName);
      setIsEditing(false);
      setProfileSuccess("Your profile has been updated.");
    } catch (error) {
      setProfileError(
        error instanceof Error
          ? error.message
          : "Unable to update your profile. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

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

              {isEditing ? (
                <input
                  className="settings-input"
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  maxLength={60}
                  placeholder="Enter your full name"
                  autoComplete="name"
                  disabled={saving}
                />
              ) : (
                <strong>{user?.name || "Not available"}</strong>
              )}
            </div>

            <div className="settings-field">
              <span>Email address</span>
              <div className="settings-email-value">
                <strong>{user?.email || "Not available"}</strong>
                <button
                  type="button"
                  onClick={() => void handleCopyEmail()}
                  disabled={!user?.email}
                  aria-label="Copy email address"
                >
                  {emailCopied ? "Copied ✓" : "Copy"}
                </button>
              </div>
              <small className="settings-field-hint">
                Email changes require a separate verification process.
              </small>
            </div>

            <div className="settings-field">
              <span>Account type</span>
              <strong>Free plan</strong>
            </div>
          </div>

          {profileError && (
            <p className="settings-profile-message settings-profile-error">
              {profileError}
            </p>
          )}

          {profileSuccess && (
            <p className="settings-profile-message settings-profile-success">
              {profileSuccess}
            </p>
          )}

          <div className="settings-profile-actions">
            {isEditing ? (
              <>
                <button
                  type="button"
                  className="settings-primary-button"
                  onClick={() => void handleSaveProfile()}
                  disabled={saving}
                >
                  {saving ? "Saving..." : "Save changes"}
                </button>

                <button
                  type="button"
                  className="settings-secondary-button"
                  onClick={handleCancelEdit}
                  disabled={saving}
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                type="button"
                className="settings-primary-button"
                onClick={handleEditProfile}
              >
                Edit profile
              </button>
            )}
          </div>
        </div>
      </section>

      <section className="settings-section">
        <div className="settings-section-heading">
          <h2>Personal workspace</h2>
          <p>Quick access to your everyday AVIA tools.</p>
        </div>

        <div className="settings-workspace-grid">
          <Link href="/goals" className="settings-workspace-card">
            <span>◎</span>
            <div>
              <strong>Goals</strong>
              <small>Manage your long-term goals</small>
            </div>
            <span className="settings-workspace-arrow">↗</span>
          </Link>

          <Link href="/habits" className="settings-workspace-card">
            <span>✓</span>
            <div>
              <strong>Habits</strong>
              <small>Build consistent routines</small>
            </div>
            <span className="settings-workspace-arrow">↗</span>
          </Link>

          <Link href="/planning" className="settings-workspace-card">
            <span>▦</span>
            <div>
              <strong>Planning</strong>
              <small>Organize your weekly schedule</small>
            </div>
            <span className="settings-workspace-arrow">↗</span>
          </Link>

          <Link href="/analytics" className="settings-workspace-card">
            <span>⌁</span>
            <div>
              <strong>Analytics</strong>
              <small>Review your progress</small>
            </div>
            <span className="settings-workspace-arrow">↗</span>
          </Link>

          <Link href="/journal" className="settings-workspace-card">
            <span>✎</span>
            <div>
              <strong>Journal</strong>
              <small>Reflect on your experiences</small>
            </div>
            <span className="settings-workspace-arrow">↗</span>
          </Link>

          <Link href="/ai-coach" className="settings-workspace-card">
            <span>✧</span>
            <div>
              <strong>AI Coach</strong>
              <small>Get personalized guidance</small>
            </div>
            <span className="settings-workspace-arrow">↗</span>
          </Link>
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