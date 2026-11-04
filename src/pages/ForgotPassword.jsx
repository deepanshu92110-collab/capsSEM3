import { Link } from "react-router-dom";
export default function ForgotPassword() {
  return (
    <main className="auth-shell">
      <section className="card auth-card">
        <p className="eyebrow">PASSWORD RESET</p>
        <h2>Reset requests are not enabled</h2>
        <p className="muted">
          Password recovery requires a verified email delivery service. Contact
          your platform administrator to reset your password.
        </p>
        <Link to="/login">Return to sign in</Link>
      </section>
    </main>
  );
}
