import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
export default function Home() {
  const { user, logout } = useAuth();
  return (
    <main className="page">
      <header className="topbar">
        <Link to="/" className="logo">
          SB <span>SkillBridge AI</span>
        </Link>
        <nav>
          <span>
            {user.fullName} · {user.role}
          </span>
          <Link to={user.role === "INDUSTRY" ? "/industry" : user.role === "INSTITUTION" ? "/institution" : "/profile"}>
            My profile
          </Link>
          {user.role === "STUDENT" && <Link to="/opportunities">Opportunities</Link>}
          {user.role === "STUDENT" && <Link to="/skills">Skills & AI</Link>}
          <Link to="/notifications">Notifications</Link>
          {user.role === "STUDENT" && <Link to="/applications">Applications</Link>}
          {user.role === "ADMIN" && <Link to="/dashboard/admin">Platform dashboard</Link>}
          <button className="text-button" onClick={logout}>
            Sign out
          </button>
        </nav>
      </header>
      <section className="page-content">
        <p className="eyebrow">YOUR WORKSPACE</p>
        <h1>Welcome, {user.fullName.split(" ")[0]}.</h1>
        <p className="muted">
          Your next opportunity starts with a strong profile.
        </p>
        <div className="card welcome-card">
          <div>
            <h2>Career activity</h2>
            <p className="muted">Review your applications, interviews, internships and placement records.</p>
          </div>
          <div className="home-activity-links">
            {user.role === "STUDENT" && <>
              <Link to="/applications">My applications</Link>
              <Link to="/interviews">My interviews</Link>
              <Link to="/internships">My internships</Link>
              <Link to="/placements">My placements</Link>
            </>}
            {user.role === "INDUSTRY" && <Link to="/industry/applicants">Manage applicants</Link>}
            {user.role === "INSTITUTION" && <Link to="/dashboard/institution">Institution dashboard</Link>}
          </div>
        </div>
        <div className="card welcome-card">
          <div>
            <h2>
              {user.role === "STUDENT"
                ? "Complete your student profile"
                : user.role === "INSTITUTION"
                  ? "Manage your institution profile"
                  : user.role === "INDUSTRY"
                    ? "Company account"
                    : "Administration"}
            </h2>
            <p className="muted">
              Keep your details up to date to make collaboration easier.
            </p>
          </div>
          <Link
            className="button-link"
            to={
              user.role === "INDUSTRY"
                ? "/industry"
                : user.role === "INSTITUTION"
                ? "/institution/edit"
                : "/profile/edit"
            }
          >
            Manage profile
          </Link>
        </div>
      </section>
    </main>
  );
}
