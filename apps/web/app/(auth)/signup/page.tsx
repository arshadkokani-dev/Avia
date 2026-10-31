"use client";

import { useState } from "react";
import Link from "next/link";
import "./../auth.css";

export default function SignupPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!name.trim() || !email.trim() || !password) {
      setError("Please complete all fields.");
      return;
    }

    if (password.length < 8) {
      setError("Your password must contain at least 8 characters.");
      return;
    }

    setError("Account creation will be connected in the next step.");
  }

  return (
    <main className="auth-page">
      <section className="auth-brand">
        <Link href="/" className="auth-logo">
          <span className="auth-logo-mark">A</span>
          AVIA
        </Link>

        <div className="auth-brand-content">
          <span className="auth-eyebrow">START WITH INTENTION</span>
          <h1>Your next chapter starts here.</h1>
          <p>
            Set meaningful goals, build consistent habits and make
            measurable progress across your life.
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

          <span className="auth-eyebrow">GET STARTED</span>
          <h2>Create your account</h2>
          <p className="auth-subtitle">
            A more intentional life begins with one step.
          </p>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="auth-field">
              <label htmlFor="name">Full name</label>
              <input
                id="name"
                type="text"
                placeholder="Your name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                autoComplete="name"
                required
              />
            </div>

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
                  placeholder="At least 8 characters"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="new-password"
                  minLength={8}
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

              <span className="auth-field-hint">
                Use at least 8 characters.
              </span>
            </div>

            {error && <p className="auth-message">{error}</p>}

            <button type="submit" className="auth-submit">
              Create account <span>→</span>
            </button>
          </form>

          <p className="auth-switch">
            Already have an account?{" "}
            <Link href="/login">Sign in</Link>
          </p>

          <p className="auth-terms">
            By creating an account, you agree to use AVIA responsibly.
          </p>
        </div>
      </section>
    </main>
  );
}