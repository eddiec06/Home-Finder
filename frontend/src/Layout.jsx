import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "./auth";

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <>
      <header className="hf-header" data-testid="site-header">
        <Link to="/" className="hf-logo" data-testid="logo-link">
          <span className="hf-logo-mark" aria-hidden="true">
            {/* Simple house outline mark. Inline SVG keeps the prototype dependency-free. */}
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#3f4750" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 11.5L12 4l9 7.5" />
              <path d="M5 10.5V20h14v-9.5" />
              <path d="M10 20v-5h4v5" />
            </svg>
          </span>
          Home<span>Finder</span>
        </Link>
        <nav className="hf-nav">
          <Link to="/" data-testid="nav-home">Browse</Link>
          {user && user.role === "admin" && (
            <Link to="/admin" data-testid="nav-admin">Admin</Link>
          )}
          {user ? (
            <>
              <span className="hf-user-chip" data-testid="user-chip">
                {user.name} ({user.role})
              </span>
              <button
                className="hf-btn hf-btn-secondary"
                onClick={async () => {
                  await logout();
                  navigate("/");
                }}
                data-testid="logout-btn"
              >
                Logout
              </button>
            </>
          ) : (
            <Link to="/login" data-testid="nav-login">
              <button className="hf-btn hf-btn-secondary">Login</button>
            </Link>
          )}
        </nav>
      </header>
      <main className="hf-container">{children}</main>
    </>
  );
}
