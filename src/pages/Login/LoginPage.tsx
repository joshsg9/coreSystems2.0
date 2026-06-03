// src/pages/Login/LoginPage.tsx
import React, { useState } from "react";
import {
  loginWithIdentifier,
  loginWithProvider,
  validateIdentifier,
} from "../../services/authService";
import type { AuthProvider } from "../../types";
import "./LoginPage.css";

const LoginPage: React.FC = () => {
  const [identifier,      setIdentifier]      = useState("");
  const [error,           setError]           = useState<string | null>(null);
  const [isLoading,       setIsLoading]       = useState(false);
  const [loadingProvider, setLoadingProvider] = useState<AuthProvider | "email" | null>(null);
  const [otpSentTo,       setOtpSentTo]       = useState<string | null>(null);

  // ── OTP confirmation screen ────────────────────────────
  if (otpSentTo) {
    return (
      <div className="login-page">
        <main className="login-main">
          <div className="login-card">
            <div className="login-header">
              <div className="login-avatar-icon">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
                  <path d="M4 4h16v12H4z" stroke="#1a1a1a" strokeWidth="1.8" strokeLinejoin="round" />
                  <path d="M4 4l8 8 8-8" stroke="#1a1a1a" strokeWidth="1.8" strokeLinejoin="round" />
                </svg>
              </div>
              <h1 className="login-title">Check your inbox</h1>
            </div>

            <p style={{ textAlign: "center", color: "#555", marginBottom: "1.5rem", lineHeight: 1.5 }}>
              We sent a sign-in link to<br />
              <strong>{otpSentTo}</strong>
            </p>

            <button
              className="btn-continue"
              disabled={isLoading}
              onClick={async () => {
                setIsLoading(true);
                setLoadingProvider("email");
                await loginWithIdentifier({ identifier: otpSentTo });
                setIsLoading(false);
                setLoadingProvider(null);
              }}
            >
              {loadingProvider === "email" ? <span className="btn-spinner" /> : "Resend link"}
            </button>

            <button
              className="trouble-link"
              style={{ marginTop: "0.75rem" }}
              onClick={() => { setOtpSentTo(null); setError(null); }}
            >
              Use a different email
            </button>
          </div>
        </main>
      </div>
    );
  }

  // ── Main login screen ──────────────────────────────────
  const handleContinue = async () => {
    const validationError = validateIdentifier(identifier);
    if (validationError) { setError(validationError); return; }

    setError(null);
    setIsLoading(true);
    setLoadingProvider("email");

    const result = await loginWithIdentifier({ identifier });

    setIsLoading(false);
    setLoadingProvider(null);

    if (!result.success) {
      setError(result.error ?? "Ocurrió un error. Intenta nuevamente.");
    } else if (result.otpSent) {
      setOtpSentTo(identifier);
    }
  };

  const handleProviderLogin = async (provider: AuthProvider) => {
    setIsLoading(true);
    setLoadingProvider(provider);

    const result = await loginWithProvider(provider);

    // OAuth redirects away immediately on success — only reset state on error
    if (!result.success) {
      setIsLoading(false);
      setLoadingProvider(null);
      setError(result.error ?? "Error al iniciar sesión.");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleContinue();
  };

  return (
    <div className="login-page">
      <main className="login-main">
        <div className="login-card">
          <div className="login-header">
            <div className="login-avatar-icon">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="8" r="4.5" stroke="#1a1a1a" strokeWidth="1.8" />
                <path d="M3.5 20.5c0-4.694 3.806-8.5 8.5-8.5s8.5 3.806 8.5 8.5" stroke="#1a1a1a" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </div>
            <h1 className="login-title">Sign in / Register</h1>
          </div>

          <div className="login-field">
            <label className="login-label" htmlFor="identifier">Email or Phone number</label>
            <input
              id="identifier"
              type="text"
              className={`login-input ${error ? "login-input--error" : ""}`}
              value={identifier}
              onChange={(e) => { setIdentifier(e.target.value); if (error) setError(null); }}
              onKeyDown={handleKeyDown}
              placeholder=""
              autoComplete="email"
            />
            {error && <p className="login-error" role="alert">{error}</p>}
          </div>

          <button className="btn-continue" onClick={handleContinue} disabled={isLoading}>
            {loadingProvider === "email" ? <span className="btn-spinner" /> : "Continue"}
          </button>

          <div className="login-divider"><span className="divider-text">Or</span></div>

          <div className="sso-group">
            <button className="sso-btn" onClick={() => handleProviderLogin("google")} disabled={isLoading}>
              {loadingProvider === "google" ? <span className="btn-spinner sso-spinner" /> : <GoogleIcon />}
              <span>Continue with Google</span>
            </button>
            <button className="sso-btn" onClick={() => handleProviderLogin("facebook")} disabled={isLoading}>
              {loadingProvider === "facebook" ? <span className="btn-spinner sso-spinner" /> : <FacebookIcon />}
              <span>Continue with Facebook</span>
            </button>
            <button className="sso-btn" onClick={() => handleProviderLogin("apple")} disabled={isLoading}>
              {loadingProvider === "apple" ? <span className="btn-spinner sso-spinner" /> : <AppleIcon />}
              <span>Continue with Apple</span>
            </button>
          </div>

          <button className="trouble-link">Trouble signing in?</button>
        </div>
        <p className="login-legal">
          By continuing, you agree to our <a href="/terms" className="legal-link">Terms of Use</a> and authorize
          the processing of your personal data in accordance with <a href="/privacy" className="legal-link">Privacy Policy</a>.
        </p>
      </main>
    </div>
  );
};

// ── Icons ──────────────────────────────────────────────
const GoogleIcon: React.FC = () => (
  <svg width="22" height="22" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
);

const FacebookIcon: React.FC = () => (
  <svg width="22" height="22" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="12" fill="#1877F2" />
    <path fill="white" d="M16.67 12H14v8h-3v-8H9.33v-3H11V7.52C11 5.5 12.19 4 14.5 4H17v3h-1.83c-.47 0-.67.22-.67.7V9h2.83l-.46 3z" />
  </svg>
);

const AppleIcon: React.FC = () => (
  <svg width="22" height="22" viewBox="0 0 24 24">
    <path fill="#000" d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.7 9.05 7.4c1.42.07 2.38.74 3.2.8 1.22-.24 2.38-.93 3.7-.84 1.58.12 2.77.74 3.54 1.9-3.27 1.97-2.54 6.32.82 7.54-.62 1.7-1.43 3.36-3.26 5.48M12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
  </svg>
);

export default LoginPage;
