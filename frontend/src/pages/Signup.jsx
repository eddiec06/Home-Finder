import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "../api";

export default function Signup() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const data = await api.register(email, password, name);
      // Server returns the same shape as /auth/login → straight into the
      // MFA verification screen.
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
    <form className="hf-card-form" onSubmit={onSubmit} data-testid="signup-form">
      <h2>Create an account</h2>
      <p className="hf-sub">
        Sign up to save favourites and post listings. Already a member?{" "}
        <Link to="/login">Log in</Link>.
      </p>

      {error && (
        <div className="hf-error" data-testid="signup-error">
          {error}
        </div>
      )}

      <div className="hf-field">
        <label htmlFor="name">Full name</label>
        <input
          id="name"
          className="hf-input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          minLength={2}
          data-testid="signup-name"
        />
      </div>
      <div className="hf-field">
        <label htmlFor="email">Email</label>
        <input
          id="email"
          className="hf-input"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          data-testid="signup-email"
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
          minLength={6}
          data-testid="signup-password"
        />
        <small style={{ color: "var(--muted)", fontSize: 12 }}>
          At least 6 characters.
        </small>
      </div>

      <button
        className="hf-btn"
        type="submit"
        disabled={busy}
        data-testid="signup-submit"
        style={{ width: "100%" }}
      >
        {busy ? "Creating account…" : "Create account"}
      </button>

      <p style={{ marginTop: 14, fontSize: 13, color: "var(--muted)" }}>
        <Link to="/">← Back to browse</Link>
      </p>
    </form>
  );
}
