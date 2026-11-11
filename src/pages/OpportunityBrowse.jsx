import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { industryService } from "../services/industryService";

const opportunityTypes = ["INTERNSHIP", "JOB", "PROJECT"];
const workModes = ["ONSITE", "HYBRID", "REMOTE"];
const pageSize = 12;

function formatDate(value) {
  if (!value) return "Not specified";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Not specified" : date.toLocaleDateString();
}

function errorMessage(error) {
  return error.response?.data?.message || "Could not load opportunities. Please try again.";
}

function OpportunityCard({ opportunity }) {
  return (
    <article className="card student-opportunity-card">
      <div className="student-opportunity-heading">
        <div>
          <p className="eyebrow">{opportunity.type}</p>
          <h2>{opportunity.title}</h2>
          <p className="student-opportunity-company">{opportunity.company?.name || "Company"}</p>
        </div>
        <span className={`industry-status industry-status-${opportunity.status?.toLowerCase()}`}>
          {opportunity.status}
        </span>
      </div>

      <dl className="student-opportunity-facts">
        {opportunity.location && <div><dt>Location</dt><dd>{opportunity.location}</dd></div>}
        {opportunity.workMode && <div><dt>Work mode</dt><dd>{opportunity.workMode}</dd></div>}
        {opportunity.compensation && <div><dt>Compensation</dt><dd>{opportunity.compensation}</dd></div>}
        {opportunity.applicationDeadline && <div><dt>Application deadline</dt><dd>{formatDate(opportunity.applicationDeadline)}</dd></div>}
        <div><dt>Openings</dt><dd>{opportunity.openings}</dd></div>
      </dl>

      <Link className="button-link" to={`/opportunities/${opportunity.id}`}>View Details</Link>
    </article>
  );
}

export default function OpportunityBrowse() {
  const { user, logout } = useAuth();
  const [opportunities, setOpportunities] = useState([]);
  const [type, setType] = useState("");
  const [workMode, setWorkMode] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function loadOpportunities() {
      setLoading(true);
      setError("");
      const params = { page, pageSize, sort: "newest" };
      if (type) params.type = type;
      if (workMode) params.workMode = workMode;
      try {
        const response = await industryService.getPublicOpportunities(params);
        if (cancelled) return;
        const data = response.data.data;
        setOpportunities(data.opportunities || []);
        setPagination(data.pagination || { page, totalPages: 1, total: 0 });
      } catch (requestError) {
        if (!cancelled) setError(errorMessage(requestError));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadOpportunities();
    return () => {
      cancelled = true;
    };
  }, [type, workMode, page, reloadKey]);

  function changeFilter(setter, value) {
    setter(value);
    setPage(1);
  }

  return (
    <main className="page">
      <header className="topbar">
        <Link to="/home" className="logo">SB <span>SkillBridge AI</span></Link>
        <nav>
          <span>{user?.fullName} · STUDENT</span>
          <Link to="/home">Home</Link>
          <Link to="/profile">My profile</Link>
          <button className="text-button" onClick={logout}>Sign out</button>
        </nav>
      </header>

      <section className="page-content student-opportunities-page">
        <p className="eyebrow">EXPLORE OPPORTUNITIES</p>
        <h1>Find your next opportunity</h1>
        <p className="muted">Browse open internships, jobs, and projects shared by companies.</p>

        <section className="card student-opportunity-filters" aria-label="Opportunity filters">
          <label>
            Type
            <select value={type} onChange={(event) => changeFilter(setType, event.target.value)}>
              <option value="">All types</option>
              {opportunityTypes.map((item) => <option value={item} key={item}>{item}</option>)}
            </select>
          </label>
          <label>
            Work mode
            <select value={workMode} onChange={(event) => changeFilter(setWorkMode, event.target.value)}>
              <option value="">All work modes</option>
              {workModes.map((item) => <option value={item} key={item}>{item}</option>)}
            </select>
          </label>
          {(type || workMode) && (
            <button className="secondary" type="button" onClick={() => { setType(""); setWorkMode(""); setPage(1); }}>
              Clear filters
            </button>
          )}
        </section>

        {loading ? (
          <div className="card student-opportunity-state" role="status">Loading open opportunities…</div>
        ) : error ? (
          <div className="card student-opportunity-state" role="alert">
            <p className="error">{error}</p>
            <button onClick={() => setReloadKey((key) => key + 1)}>Try again</button>
          </div>
        ) : opportunities.length === 0 ? (
          <div className="card student-opportunity-state">
            <h2>No open opportunities found</h2>
            <p className="muted">Try changing your filters, or check again later for new listings.</p>
          </div>
        ) : (
          <>
            <p className="student-opportunity-result-count">{pagination.total} open {pagination.total === 1 ? "opportunity" : "opportunities"}</p>
            <div className="student-opportunity-list">
              {opportunities.map((opportunity) => <OpportunityCard key={opportunity.id} opportunity={opportunity} />)}
            </div>
            {pagination.totalPages > 1 && (
              <nav className="opportunity-pagination" aria-label="Opportunity pages">
                <button className="secondary" disabled={page <= 1} onClick={() => setPage((current) => current - 1)}>Previous</button>
                <span>Page {pagination.page} of {pagination.totalPages}</span>
                <button className="secondary" disabled={page >= pagination.totalPages} onClick={() => setPage((current) => current + 1)}>Next</button>
              </nav>
            )}
          </>
        )}
      </section>
    </main>
  );
}
