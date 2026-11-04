import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
export default function Register() {
  const { register } = useAuth(),
    navigate = useNavigate();
  const [form, setForm] = useState({
      role: "STUDENT",
      fullName: "",
      email: "",
      password: "",
      phone: "",
      institutionName: "",
      companyName: "",
    }),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const set = (key, value) => setForm({ ...form, [key]: value });
  async function submit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await register(form);
      navigate("/login", { state: { registered: true } });
    } catch (err) {
      setError(
        err.response?.data?.message ||
          (err.request
            ? "Cannot reach the SkillBridge API. Start the backend server on port 5050 and try again."
            : "Unable to create account"),
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="auth-shell">
      <section className="brand">
        <span className="mark">SB</span>
        <p className="eyebrow">JOIN SKILLBRIDGE</p>
        <h1>
          Bring skills,
          <br />
          people and opportunity together.
        </h1>
        <p>Create a workspace for your next step.</p>
      </section>
      <form className="card auth-card" onSubmit={submit}>
        <p className="eyebrow">GET STARTED</p>
        <h2>Create account</h2>
        <label>
          Account type
          <select
            value={form.role}
            onChange={(e) => set("role", e.target.value)}
          >
            <option value="STUDENT">Student</option>
            <option value="INSTITUTION">Institution</option>
            <option value="INDUSTRY">Industry / Company</option>
          </select>
        </label>
        <label>
          Full name
          <input
            required
            value={form.fullName}
            onChange={(e) => set("fullName", e.target.value)}
          />
        </label>
        {form.role === "INSTITUTION" && (
          <label>
            Institution name
            <input
              required
              value={form.institutionName}
              onChange={(e) => set("institutionName", e.target.value)}
            />
          </label>
        )}
        {form.role === "INDUSTRY" && (
          <label>
            Company name
            <input
              required
              value={form.companyName}
              onChange={(e) => set("companyName", e.target.value)}
            />
          </label>
        )}
        <label>
          Email
          <input
            type="email"
            required
            value={form.email}
            onChange={(e) => set("email", e.target.value)}
          />
        </label>
        <label>
          Phone
          <input
            value={form.phone}
            onChange={(e) => set("phone", e.target.value)}
          />
        </label>
        <label>
          Password
          <input
            type="password"
            minLength="8"
            required
            value={form.password}
            onChange={(e) => set("password", e.target.value)}
          />
        </label>
        {error && <p className="error">{error}</p>}
        <button disabled={busy}>{busy ? "Creating…" : "Create account"}</button>
        <p className="muted">
          Already registered? <Link to="/login">Sign in</Link>
        </p>
      </form>
    </main>
  );
}
