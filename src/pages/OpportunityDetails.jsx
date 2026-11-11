import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { industryService } from "../services/industryService";

function formatDate(value) {
  if (!value) return "Not specified";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Not specified" : date.toLocaleString();
}

function getErrorMessage(error) {
  return error.response?.data?.message || "Could not load this opportunity. Please try again.";
}

function Detail({ label, children }) {
  return (
    <div className="student-opportunity-detail">
      <dt>{label}</dt>
      <dd>{children || "Not provided"}</dd>
    </div>
  );
}

export default function OpportunityDetails() {
  const { id } = useParams();
  const { user, logout } = useAuth();
  const [opportunity, setOpportunity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notFound, setNotFound] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function loadOpportunity() {
      setLoading(true);
      setError("");
      setNotFound(false);
      try {
        const response = await industryService.getOpportunity(id);
        if (!cancelled) setOpportunity(response.data.data.opportunity);
      } catch (requestError) {
        if (cancelled) return;
        if (requestError.response?.status === 404) {
          setNotFound(true);
          setError("This opportunity was not found or is no longer open.");
        } else {
          setError(getErrorMessage(requestError));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadOpportunity();
    return () => {
      cancelled = true;
    };
  }, [id, reloadKey]);

  return (
    <main className="page">
      <header className="topbar">
        <Link to="/home" className="logo">SB <span>SkillBridge AI</span></Link>
        <nav>
          <span>{user?.fullName} · STUDENT</span>
          <Link to="/home">Home</Link>
          <Link to="/profile">My profile</Link>
          <Link to="/opportunities">Opportunities</Link>
          <button className="text-button" onClick={logout}>Sign out</button>
        </nav>
      </header>

      <section className="page-content student-opportunity-details-page">
        <Link className="industry-inline-link" to="/opportunities">← Back to Opportunities</Link>

        {loading ? (
          <div className="card student-opportunity-details-state" role="status">Loading opportunity details…</div>
        ) : error ? (
          <div className="card student-opportunity-details-state" role="alert">
            {notFound ? <h1>Opportunity unavailable</h1> : <h1>Unable to load opportunity</h1>}
            <p className="error">{error}</p>
            {!notFound && <button onClick={() => setReloadKey((key) => key + 1)}>Try again</button>}
            {notFound && <Link className="button-link" to="/opportunities">Browse open opportunities</Link>}
          </div>
        ) : opportunity ? (
          <article className="card student-opportunity-details-card">
            <div className="student-opportunity-details-heading">
              <div>
                <p className="eyebrow">{opportunity.type}</p>
                <h1>{opportunity.title}</h1>
                <p className="student-opportunity-details-company">{opportunity.company?.name || "Company"}</p>
              </div>
              {opportunity.status && (
                <span className={`industry-status industry-status-${opportunity.status.toLowerCase()}`}>
                  {opportunity.status}
                </span>
              )}
            </div>

            <dl className="student-opportunity-details-grid">
              <Detail label="Description">{opportunity.description}</Detail>
              <Detail label="Responsibilities">{opportunity.responsibilities}</Detail>
              <Detail label="Qualifications">{opportunity.qualifications}</Detail>
              <Detail label="Location">{opportunity.location}</Detail>
              <Detail label="Work mode">{opportunity.workMode}</Detail>
              <Detail label="Compensation">{opportunity.compensation}</Detail>
              <Detail label="Number of openings">{opportunity.openings}</Detail>
              <Detail label="Application deadline">{formatDate(opportunity.applicationDeadline)}</Detail>
              {opportunity.startDate && <Detail label="Start date">{formatDate(opportunity.startDate)}</Detail>}
              {opportunity.endDate && <Detail label="End date">{formatDate(opportunity.endDate)}</Detail>}
            </dl>

            {opportunity.applicationUrl && (
              <a className="button-link student-opportunity-apply-link" href={opportunity.applicationUrl} target="_blank" rel="noopener noreferrer">
                Apply on company website
              </a>
            )}
          </article>
        ) : null}
      </section>
    </main>
  );
}
