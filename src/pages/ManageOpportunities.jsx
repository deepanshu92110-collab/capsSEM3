import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { industryService } from "../services/industryService";

const filters = [
  { value: "ALL", label: "All" },
  { value: "DRAFT", label: "Draft" },
  { value: "OPEN", label: "Open" },
  { value: "CLOSED", label: "Closed" },
  { value: "ARCHIVED", label: "Archived" },
];
const pageSize = 10;

function requestError(error) {
  return error.response?.data?.message || "Something went wrong. Please try again.";
}

function formatDate(value) {
  if (!value) return "Not set";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Not set" : date.toLocaleDateString();
}

function StatusBadge({ status }) {
  return <span className={`industry-status industry-status-${status?.toLowerCase()}`}>{status || "Unknown"}</span>;
}

export default function ManageOpportunities() {
  const { user, logout } = useAuth();
  const [opportunities, setOpportunities] = useState([]);
  const [filter, setFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [success, setSuccess] = useState("");
  const [busyId, setBusyId] = useState("");
  const [expandedId, setExpandedId] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function loadOpportunities() {
      setLoading(true);
      setError("");
      try {
        const params = { page, pageSize, sort: "newest" };
        if (filter !== "ALL") params.status = filter;
        const response = await industryService.getMyOpportunities(params);
        if (cancelled) return;
        const data = response.data.data;
        setOpportunities(data.opportunities || []);
        setPagination(data.pagination || { page, totalPages: 1, total: 0 });
      } catch (loadError) {
        if (!cancelled) setError(requestError(loadError));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadOpportunities();
    return () => {
      cancelled = true;
    };
  }, [filter, page, reloadKey]);

  function selectFilter(value) {
    setFilter(value);
    setPage(1);
    setActionError("");
    setSuccess("");
  }

  async function changeStatus(opportunity, nextStatus) {
    if (nextStatus === "ARCHIVED" && !window.confirm(`Archive “${opportunity.title}”? Archived opportunities cannot be reopened.`)) return;
    setBusyId(opportunity.id);
    setActionError("");
    setSuccess("");
    try {
      await industryService.updateOpportunityStatus(opportunity.id, nextStatus);
      setSuccess(`“${opportunity.title}” is now ${nextStatus.toLowerCase()}.`);
      setReloadKey((key) => key + 1);
    } catch (actionFailure) {
      setActionError(requestError(actionFailure));
    } finally {
      setBusyId("");
    }
  }

  async function deleteDraft(opportunity) {
    if (!window.confirm(`Delete draft “${opportunity.title}”? This cannot be undone.`)) return;
    setBusyId(opportunity.id);
    setActionError("");
    setSuccess("");
    try {
      await industryService.deleteOpportunity(opportunity.id);
      setSuccess(`“${opportunity.title}” was deleted.`);
      setReloadKey((key) => key + 1);
    } catch (actionFailure) {
      setActionError(requestError(actionFailure));
    } finally {
      setBusyId("");
    }
  }

  const emptyLabel = filter === "ALL"
    ? "No opportunities yet. Your new listings will appear here."
    : `There are no ${filter.toLowerCase()} opportunities.`;

  return (
    <main className="page">
      <header className="topbar">
        <Link to="/industry" className="logo">SB <span>SkillBridge AI</span></Link>
        <nav>
          <span>{user?.fullName} · INDUSTRY</span>
          <Link to="/industry">Dashboard</Link>
          <Link to="/industry/company">Company Profile</Link>
          <button className="text-button" onClick={logout}>Sign out</button>
        </nav>
      </header>

      <section className="page-content manage-opportunities-page">
        <div className="manage-opportunities-heading">
          <div>
            <p className="eyebrow">INDUSTRY WORKSPACE</p>
            <h1>Manage Opportunities</h1>
            <p className="muted">Review listings and update their status.</p>
          </div>
          <Link className="button-link" to="/industry/opportunities/new">Create opportunity</Link>
        </div>

        <div className="opportunity-filter-row" aria-label="Filter opportunities by status">
          {filters.map((item) => (
            <button
              className={filter === item.value ? "opportunity-filter is-active" : "opportunity-filter"}
              key={item.value}
              type="button"
              aria-pressed={filter === item.value}
              onClick={() => selectFilter(item.value)}
            >
              {item.label}
            </button>
          ))}
        </div>

        {success && <p className="opportunity-feedback opportunity-feedback-success" role="status">{success}</p>}
        {actionError && <p className="opportunity-feedback error" role="alert">{actionError}</p>}

        {loading ? (
          <div className="card opportunity-list-state" role="status">Loading opportunities…</div>
        ) : error ? (
          <div className="card opportunity-list-state" role="alert">
            <p className="error">{error}</p>
            <button onClick={() => setReloadKey((key) => key + 1)}>Try again</button>
          </div>
        ) : opportunities.length === 0 ? (
          <div className="card opportunity-list-state">
            <h2>No opportunities found</h2>
            <p className="muted">{emptyLabel}</p>
            {filter === "ALL" && <Link className="button-link" to="/industry/opportunities/new">Create opportunity</Link>}
          </div>
        ) : (
          <>
            <div className="opportunity-management-list">
              {opportunities.map((opportunity) => {
                const busy = busyId === opportunity.id;
                return (
                  <article className="card opportunity-management-card" key={opportunity.id}>
                    <div className="opportunity-card-heading">
                      <div>
                        <p className="eyebrow">{opportunity.type}</p>
                        <h2>{opportunity.title}</h2>
                      </div>
                      <StatusBadge status={opportunity.status} />
                    </div>

                    <dl className="opportunity-facts">
                      <div><dt>Location</dt><dd>{opportunity.location || "Not specified"}</dd></div>
                      <div><dt>Work mode</dt><dd>{opportunity.workMode || "Not specified"}</dd></div>
                      <div><dt>Application deadline</dt><dd>{formatDate(opportunity.applicationDeadline)}</dd></div>
                      <div><dt>Openings</dt><dd>{opportunity.openings}</dd></div>
                    </dl>

                    <div className="opportunity-card-actions">
                      <button
                        className="opportunity-text-action"
                        type="button"
                        aria-expanded={expandedId === opportunity.id}
                        onClick={() => setExpandedId((current) => current === opportunity.id ? "" : opportunity.id)}
                      >
                        {expandedId === opportunity.id ? "Hide details" : "View details"}
                      </button>
                      {opportunity.status !== "ARCHIVED" && (
                        <Link className="industry-inline-link" to={`/industry/opportunities/${opportunity.id}/edit`}>Edit opportunity</Link>
                      )}
                      {opportunity.status === "DRAFT" && (
                        <>
                          <button disabled={busy} onClick={() => changeStatus(opportunity, "OPEN")}>{busy ? "Updating…" : "Publish draft"}</button>
                          <button className="secondary" disabled={busy} onClick={() => changeStatus(opportunity, "ARCHIVED")}>Archive</button>
                          <button className="danger-button" disabled={busy} onClick={() => deleteDraft(opportunity)}>Delete draft</button>
                        </>
                      )}
                      {opportunity.status === "OPEN" && (
                        <>
                          <button className="secondary" disabled={busy} onClick={() => changeStatus(opportunity, "CLOSED")}>{busy ? "Updating…" : "Close opportunity"}</button>
                          <button className="secondary" disabled={busy} onClick={() => changeStatus(opportunity, "ARCHIVED")}>Archive</button>
                        </>
                      )}
                      {opportunity.status === "CLOSED" && (
                        <>
                          <button disabled={busy} onClick={() => changeStatus(opportunity, "OPEN")}>{busy ? "Updating…" : "Reopen opportunity"}</button>
                          <button className="secondary" disabled={busy} onClick={() => changeStatus(opportunity, "ARCHIVED")}>Archive</button>
                        </>
                      )}
                    </div>
                    {expandedId === opportunity.id && (
                      <div className="opportunity-expanded-details">
                        <p><strong>Description</strong>{opportunity.description || "Not provided"}</p>
                        <p><strong>Responsibilities</strong>{opportunity.responsibilities || "Not provided"}</p>
                        <p><strong>Qualifications</strong>{opportunity.qualifications || "Not provided"}</p>
                        <p><strong>Compensation</strong>{opportunity.compensation || "Not provided"}</p>
                        <p><strong>Application link</strong>{opportunity.applicationUrl || "Not provided"}</p>
                        <p><strong>Dates</strong>{formatDate(opportunity.startDate)} – {formatDate(opportunity.endDate)}</p>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>

            {pagination.totalPages > 1 && (
              <nav className="opportunity-pagination" aria-label="Opportunity pages">
                <button className="secondary" disabled={page <= 1} onClick={() => setPage((current) => current - 1)}>Previous</button>
                <span>Page {pagination.page} of {pagination.totalPages} · {pagination.total} opportunities</span>
                <button className="secondary" disabled={page >= pagination.totalPages} onClick={() => setPage((current) => current + 1)}>Next</button>
              </nav>
            )}
          </>
        )}
      </section>
    </main>
  );
}
