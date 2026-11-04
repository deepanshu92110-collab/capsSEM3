import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate(),
    location = useLocation();
  const [form, setForm] = useState({ email: "", password: "" }),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  async function submit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await login(form);
      navigate(location.state?.from?.pathname || "/");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          (err.request
            ? "Cannot reach the SkillBridge API. Start the backend server on port 5050 and try again."
            : "Unable to sign in"),
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="auth-shell">
      <section className="brand">
        <span className="mark">SB</span>
        <p className="eyebrow">SKILLBRIDGE AI</p>
        <h1>
          Build the bridge
          <br />
          to your next opportunity.
        </h1>
        <p>
          One profile connecting learning, industry skills and meaningful
          careers.
        </p>
      </section>
      <form className="card auth-card" onSubmit={submit}>
        <p className="eyebrow">WELCOME BACK</p>
        <h2>Sign in</h2>
        <label>
          Email
          <input
            type="email"
            autoComplete="email"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </label>
        <label>
          Password
          <input
            type="password"
            autoComplete="current-password"
            required
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
        </label>
        {error && <p className="error">{error}</p>}
        <button disabled={busy}>{busy ? "Signing in…" : "Sign in"}</button>
        <p className="muted">
          New to SkillBridge? <Link to="/register">Create an account</Link>
        </p>
        <Link className="muted" to="/forgot-password">
          Forgot password?
        </Link>
      </form>
    </main>
  );
}
