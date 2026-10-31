"use client";

import { useState } from "react";
import Link from "next/link";
import "./../auth.css";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }

    setError("Authentication will be connected in the next step.");
  }

  return (
    <main className="auth-page">
      <section className="auth-brand">
        <Link href="/" className="auth-logo">
          <span className="auth-logo-mark">A</span>
          AVIA
        </Link>

        <div className="auth-brand-content">
          <span className="auth-eyebrow">YOUR LIFE, IN MOTION</span>
          <h1>Build a life that moves you forward.</h1>
          <p>
            Bring your goals, habits, health and growth together in one
            intelligent space.
          </p>
        </div>

        <span className="auth-brand-footer">
          A Vision in Action.
        </span>
      </section>

      <section className="auth-form-section">
        <div className="auth-form-container">
          <div className="auth-mobile-logo">
            <Link href="/" className="auth-logo">
              <span className="auth-logo-mark">A</span>
              AVIA
            </Link>
          </div>

          <span className="auth-eyebrow">WELCOME BACK</span>
          <h2>Sign in to AVIA</h2>
          <p className="auth-subtitle">
            Continue building the life you want.
          </p>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="auth-field">
              <label htmlFor="email">Email address</label>
              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                required
              />
            </div>

            <div className="auth-field">
              <label htmlFor="password">Password</label>

              <div className="auth-password-wrapper">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="current-password"
                  required
                />

                <button
                  type="button"
                  className="auth-password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            {error && <p className="auth-message">{error}</p>}

            <button type="submit" className="auth-submit">
              Sign in <span>→</span>
            </button>
          </form>

          <p className="auth-switch">
            Don't have an account?{" "}
            <Link href="/signup">Create an account</Link>
          </p>

          <p className="auth-terms">
            By continuing, you agree to use AVIA responsibly.
          </p>
        </div>
      </section>
    </main>
  );
}