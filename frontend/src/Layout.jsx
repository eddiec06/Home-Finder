import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "./auth";

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <>
      <header className="hf-header" data-testid="site-header">
        <Link to="/" className="hf-logo" data-testid="logo-link">
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
