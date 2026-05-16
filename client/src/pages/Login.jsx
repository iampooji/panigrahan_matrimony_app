import { useState } from "react";
import { api } from "../api/apiClient";
import { useAuth } from "../auth/AuthContext";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await api("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      if (res.token) {
        login(res.token);
        navigate("/", { replace: true });
      } else {
        setError(res.message || "Invalid email or password.");
      }
    } catch (err) {
      setError(err.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-pg">
      <div className="login-orb login-orb-1" />
      <div className="login-orb login-orb-2" />
      <div className="login-orb login-orb-3" />

      <div className="login-card">
        <div className="login-logo">Panigrahan</div>
        <h1 className="login-heading">Welcome!!!</h1>

        <form onSubmit={submit} noValidate>
          <div className="field-wrap">
            <label className="field-label" htmlFor="login-email">
              Email address
            </label>
            <input
              id="login-email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              autoFocus
            />
          </div>

          <div className="field-wrap">
            <label className="field-label" htmlFor="login-password">
              Password
            </label>
            <input
              id="login-password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>

          {error && (
            <div className="login-error">
              <span className="login-error-icon">!</span>
              {error}
            </div>
          )}

          <button type="submit" className="btn-login" disabled={loading}>
            {loading ? (
              <>
                <span className="login-spinner" />
                Signing in…
              </>
            ) : (
              "Sign In"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}