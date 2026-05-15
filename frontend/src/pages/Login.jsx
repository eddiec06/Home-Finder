import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "../api";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("admin@homefinder.local");
  const [password, setPassword] = useState("Admin@123");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const data = await api.login(email, password);
      // Move to the MFA verification screen, passing the challenge_token
      // (and the simulated code so the demo banner can show it).
      navigate("/mfa", {
        state: {
          challenge_token: data.challenge_token,
          simulated_code: data.simulated_code,
          email: data.email,
        },
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="hf-card-form" onSubmit={onSubmit} data-testid="login-form">
      <h2>Sign in</h2>
      <p className="hf-sub">
        Step 1 of 2 — credentials. Demo admin is pre-filled below.
      </p>
      {error && (
        <div className="hf-error" data-testid="login-error">
          {error}
        </div>
      )}
      <div className="hf-field">
        <label htmlFor="email">Email</label>
        <input
          id="email"
          className="hf-input"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          data-testid="login-email"
        />
      </div>
      <div className="hf-field">
        <label htmlFor="password">Password</label>
        <input
          id="password"
          className="hf-input"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          data-testid="login-password"
        />
      </div>
      <button
        className="hf-btn"
        type="submit"
        disabled={busy}
        data-testid="login-submit"
        style={{ width: "100%" }}
      >
        {busy ? "Verifying…" : "Continue"}
      </button>
      <p style={{ marginTop: 14, fontSize: 13, color: "var(--muted)" }}>
        <Link to="/">← Back to browse</Link>
      </p>
    </form>
  );
}
