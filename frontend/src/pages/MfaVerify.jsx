import { useState } from "react";
import { useLocation, useNavigate, Navigate } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../auth";

export default function MfaVerify() {
  const location = useLocation();
  const navigate = useNavigate();
  const { completeLogin } = useAuth();

  const state = location.state || {};
  const { challenge_token, simulated_code, email } = state;

  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (!challenge_token) {
    return <Navigate to="/login" replace />;
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const data = await api.verifyMfa(challenge_token, code.trim());
      completeLogin(data.access_token, data.user);
      navigate(data.user.role === "admin" ? "/admin" : "/");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="hf-card-form" onSubmit={onSubmit} data-testid="mfa-form">
      <h2>Verify it’s you</h2>
      <p className="hf-sub">
        Step 2 of 2 — we sent a 6-digit code to <strong>{email}</strong>.
      </p>

      {simulated_code && (
        <div className="hf-info" data-testid="simulated-code-banner">
          <strong>Demo notice:</strong> SMTP is simulated for this prototype.
          Your one-time code is <code data-testid="simulated-code">{simulated_code}</code>.
        </div>
      )}

      {error && (
        <div className="hf-error" data-testid="mfa-error">
          {error}
        </div>
      )}

      <div className="hf-field">
        <label htmlFor="code">6-digit code</label>
        <input
          id="code"
          className="hf-input"
          inputMode="numeric"
          maxLength={6}
          pattern="\d{6}"
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
          required
          autoFocus
          data-testid="mfa-code-input"
          style={{ letterSpacing: 4, fontSize: 18, textAlign: "center" }}
        />
      </div>

      <button
        className="hf-btn"
        type="submit"
        disabled={busy || code.length !== 6}
        data-testid="mfa-submit"
        style={{ width: "100%" }}
      >
        {busy ? "Verifying…" : "Verify & continue"}
      </button>

      <p style={{ marginTop: 14, fontSize: 13, color: "var(--muted)" }}>
        Codes expire after 5 minutes.
      </p>
    </form>
  );
}
