import { useState, type FormEvent } from "react";
import { login, register, startDemo } from "../api";
import type { Session } from "../auth";
import { Brand } from "./Logo";
import "./LoginPage.css";

type Mode = "login" | "register";
type Busy = "form" | "demo" | null;

type LoginPageProps = {
  onLoggedIn: (session: Session) => void;
};

// Must match the password rule in RegisterRequest.java
const MIN_PASSWORD = 8;

export default function LoginPage({ onLoggedIn }: LoginPageProps) {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<Busy>(null);

  const isLogin = mode === "login";
  const passwordTooShort = !isLogin && password.length < MIN_PASSWORD;

  function switchMode(next: Mode) {
    setMode(next);
    setError(null);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    if (passwordTooShort) {
      setError(`Your password needs at least ${MIN_PASSWORD} characters.`);
      return;
    }

    setBusy("form");
    setError(null);
    try {
      const session = isLogin
        ? await login(email.trim(), password)
        : await register(email.trim(), password);
      onLoggedIn(session);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again.",
      );
      setBusy(null);
    }
  }

  async function handleDemo() {
    setBusy("demo");
    setError(null);
    try {
      onLoggedIn(await startDemo());
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not start the demo.",
      );
      setBusy(null);
    }
  }

  return (
    <main className="login-page">
      <section className="login-hero">
        <Brand size={36} onDark />

        <div className="login-hero-body">
          <h1>Ask your documents. Get answers with the page they came from.</h1>
          <ul className="login-features">
            <li>
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
                <path d="M14 3v5h5" />
                <path d="M9 13h6" />
                <path d="M9 17h4" />
              </svg>
              Every answer cites its page
            </li>
            <li>
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="12" cy="12" r="9" />
                <path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6v.6" />
                <path d="M12 17h.01" />
              </svg>
              Says "I don't know" instead of guessing
            </li>
            <li>
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <rect x="5" y="11" width="14" height="10" rx="2" />
                <path d="M8 11V8a4 4 0 0 1 8 0v3" />
              </svg>
              Your documents stay private to you
            </li>
          </ul>
        </div>

        <p className="login-hero-foot">
          HR handbooks, tenancy agreements, contracts and more
        </p>
      </section>

      <section className="login-panel">
        <form className="login-form" onSubmit={handleSubmit} noValidate={false}>
          <div>
            <h2>{isLogin ? "Welcome back" : "Create your account"}</h2>
            <p className="login-sub">
              {isLogin
                ? "Log in to see your documents."
                : "Upload your own PDFs and ask them anything."}
            </p>
          </div>

          <div className="login-tabs">
            <button
              type="button"
              aria-pressed={isLogin}
              onClick={() => switchMode("login")}
            >
              Log in
            </button>
            <button
              type="button"
              aria-pressed={!isLogin}
              onClick={() => switchMode("register")}
            >
              Create account
            </button>
          </div>

          {error && (
            <p className="login-error" role="alert">
              {error}
            </p>
          )}

          <label className="field">
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              placeholder="you@example.com"
              required
            />
          </label>

          <label className="field">
            Password
            <span className="password-box">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={isLogin ? "current-password" : "new-password"}
                required
              />
              <button
                type="button"
                className="password-toggle"
                aria-label={showPassword ? "Hide password" : "Show password"}
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M3 3l18 18" />
                    <path d="M10.6 5.1A10 10 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3.2 4.2" />
                    <path d="M6.6 6.6C3.9 8.4 2 12 2 12s3.5 7 10 7a9.7 9.7 0 0 0 5.4-1.6" />
                    <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </span>
          </label>

          {!isLogin && (
            <p
              className={`password-hint ${password.length >= MIN_PASSWORD ? "ok" : ""}`}
            >
              {password.length >= MIN_PASSWORD ? "✓ " : ""}At least{" "}
              {MIN_PASSWORD} characters
            </p>
          )}

          <button
            type="submit"
            className="btn-primary"
            disabled={busy !== null}
          >
            {busy === "form"
              ? isLogin
                ? "Logging in…"
                : "Creating your account…"
              : isLogin
                ? "Log in"
                : "Create account"}
          </button>

          <div className="login-divider">or</div>

          <button
            type="button"
            className="btn-demo"
            onClick={handleDemo}
            disabled={busy !== null}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M7 4v16l13-8z" />
            </svg>
            {busy === "demo" ? "Setting up your demo…" : "Try the demo"}
          </button>
          <p className="login-demo-note">
            Opens a private demo with a sample HR handbook
          </p>
        </form>
      </section>
    </main>
  );
}
