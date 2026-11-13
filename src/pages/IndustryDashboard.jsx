import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { industryService } from "../services/industryService";
import { dashboardService } from "../services/person4Service";

const statuses = ["DRAFT", "OPEN", "CLOSED", "ARCHIVED"];

function getMessage(error) {
  return error.response?.data?.message || "Could not load the industry dashboard. Please try again.";
}

function StatusBadge({ status }) {
  return <span className={`industry-status industry-status-${status?.toLowerCase()}`}>{status || "Unknown"}</span>;
}

function formatDate(value) {
  if (!value) return "No deadline";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "No deadline" : `Apply by ${date.toLocaleDateString()}`;
}

export default function IndustryDashboard() {
  const { user, logout } = useAuth();
  const [company, setCompany] = useState(null);
  const [recentOpportunities, setRecentOpportunities] = useState([]);
  const [counts, setCounts] = useState({ total: 0, DRAFT: 0, OPEN: 0, CLOSED: 0, ARCHIVED: 0 });
  const [hiringStats, setHiringStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function loadDashboard() {
      setLoading(true);
      setError("");
      try {
        const [companyResponse, recentResponse, hiringResponse, ...statusResponses] = await Promise.all([
          industryService.getMyCompany(),
          industryService.getMyOpportunities({ page: 1, pageSize: 5, sort: "newest" }),
          dashboardService.industry(),
          ...statuses.map((status) =>
            industryService.getMyOpportunities({ page: 1, pageSize: 1, status }),
          ),
        ]);

        if (cancelled) return;
        const recentData = recentResponse.data.data;
        const statusCounts = Object.fromEntries(
          statuses.map((status, index) => [
            status,
            statusResponses[index].data.data.pagination?.total ?? 0,
          ]),
        );
        setCompany(companyResponse.data.data.company);
        setRecentOpportunities(recentData.opportunities || []);
        setHiringStats(hiringResponse.data.data);
        setCounts({
          total: recentData.pagination?.total ?? recentData.opportunities?.length ?? 0,
          ...statusCounts,
        });
      } catch (requestError) {
        if (!cancelled) setError(getMessage(requestError));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadDashboard();
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  return (
    <main className="page">
      <header className="topbar">
        <Link to="/industry" className="logo">
          SB <span>SkillBridge AI</span>
        </Link>
        <nav>
          <span>{user?.fullName} · INDUSTRY</span>
          <Link to="/industry/company">Company Profile</Link>
          <Link to="/industry/opportunities">Manage Opportunities</Link>
          <Link to="/industry/applicants">Applicants</Link>
          <button className="text-button" onClick={logout}>Sign out</button>
        </nav>
      </header>

      <section className="page-content industry-dashboard">
        <p className="eyebrow">INDUSTRY WORKSPACE</p>
        <h1>Welcome, {user?.fullName?.split(" ")[0] || "Industry partner"}.</h1>
        <p className="muted">Manage your company profile and keep track of your opportunities.</p>

        {loading ? (
          <div className="card industry-state" role="status">Loading your industry dashboard…</div>
        ) : error ? (
          <div className="card industry-state" role="alert">
            <p className="error">{error}</p>
            <button onClick={() => setReloadKey((key) => key + 1)}>Try again</button>
          </div>
        ) : (
          <>
            <section className="industry-overview" aria-label="Company and opportunity summary">
              <article className="card industry-company-card">
                <div>
                  <p className="eyebrow">YOUR COMPANY</p>
                  <h2>{company?.name || "Company profile"}</h2>
                </div>
                <p className={`industry-verification ${company?.isVerified ? "is-verified" : "is-pending"}`}>
                  <span className="industry-verification-dot" aria-hidden="true" />
                  {company?.isVerified ? "Verified" : "Pending Verification"}
                </p>
                <Link className="industry-inline-link" to="/industry/company">View company profile →</Link>
              </article>

              <article className="card industry-total-card">
                <p className="eyebrow">TOTAL OPPORTUNITIES</p>
                <strong>{counts.total}</strong>
                <span className="muted">Across all statuses</span>
              </article>
            </section>

            <section className="industry-status-grid" aria-label="Opportunity counts by status">
              {statuses.map((status) => (
                <article className="card industry-count-card" key={status}>
                  <span className="muted">{status[0] + status.slice(1).toLowerCase()}</span>
                  <strong>{counts[status]}</strong>
                </article>
              ))}
            </section>

            <section className="industry-status-grid" aria-label="Hiring activity">
              {[
                ["Applicants", Object.values(hiringStats?.applications || {}).reduce((a, b) => a + b, 0)],
                ["New this week", hiringStats?.newApplications ?? 0],
                ["Shortlisted", hiringStats?.applications?.SHORTLISTED ?? 0],
                ["Selected", hiringStats?.applications?.SELECTED ?? 0],
                ["Interviews", hiringStats?.interviews ?? 0],
                ["Internships", hiringStats?.internships ?? 0],
              ].map(([label, count]) => <article className="card industry-count-card" key={label}><span className="muted">{label}</span><strong>{count}</strong></article>)}
            </section>

            <section className="card industry-recent-card">
              <div className="industry-section-heading">
                <div>
                  <p className="eyebrow">YOUR LISTINGS</p>
                  <h2>Recent opportunities</h2>
                </div>
                <Link className="industry-inline-link" to="/industry/opportunities">Manage all →</Link>
              </div>
              {recentOpportunities.length === 0 ? (
                <div className="industry-empty-state">
                  <h3>Your opportunity list is ready</h3>
                  <p className="muted">There are no opportunities yet. Create a listing to start connecting with students.</p>
                  <Link className="button-link" to="/industry/opportunities/new">Create an opportunity</Link>
                </div>
              ) : (
                <ul className="industry-recent-list">
                  {recentOpportunities.map((opportunity) => (
                    <li key={opportunity.id}>
                      <div className="industry-opportunity-copy">
                        <Link to="/industry/opportunities" className="industry-opportunity-title">
                          {opportunity.title}
                        </Link>
                        <span className="muted">{opportunity.type} · {formatDate(opportunity.applicationDeadline)}</span>
                      </div>
                      <StatusBadge status={opportunity.status} />
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        )}
      </section>
    </main>
  );
}
