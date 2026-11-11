import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { industryService } from "../services/industryService";

const fields = [
  { name: "name", label: "Company name", type: "text", required: true, maxLength: 200 },
  { name: "officialEmail", label: "Official email", type: "email", required: true, maxLength: 254 },
  { name: "website", label: "Website", type: "url", maxLength: 2048 },
  { name: "address", label: "Address", type: "text", maxLength: 500 },
  { name: "description", label: "Description", multiline: true, maxLength: 5000 },
  { name: "contactInfo", label: "Contact information", multiline: true, maxLength: 1000 },
];

function toForm(company) {
  return Object.fromEntries(fields.map(({ name }) => [name, company?.[name] || ""]));
}

function getErrorMessage(error) {
  return error.response?.data?.message || "Could not load the company profile. Please try again.";
}

export default function CompanyProfile() {
  const { user, logout } = useAuth();
  const [company, setCompany] = useState(null);
  const [form, setForm] = useState(toForm(null));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function loadCompany() {
      setLoading(true);
      setError("");
      try {
        const response = await industryService.getMyCompany();
        if (cancelled) return;
        const loadedCompany = response.data.data.company;
        setCompany(loadedCompany);
        setForm(toForm(loadedCompany));
      } catch (requestError) {
        if (!cancelled) setError(getErrorMessage(requestError));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadCompany();
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setError("");
    setSuccess("");
  }

  function cancelEdit() {
    setForm(toForm(company));
    setEditing(false);
    setError("");
    setSuccess("");
  }

  async function saveProfile(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const response = await industryService.updateMyCompany(form);
      const updatedCompany = response.data.data.company;
      setCompany(updatedCompany);
      setForm(toForm(updatedCompany));
      setEditing(false);
      setSuccess("Company profile saved.");
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="page">
      <header className="topbar">
        <Link to="/industry" className="logo">
          SB <span>SkillBridge AI</span>
        </Link>
        <nav>
          <span>{user?.fullName} · INDUSTRY</span>
          <Link to="/industry">Dashboard</Link>
          <Link to="/industry/opportunities">Manage Opportunities</Link>
          <button className="text-button" onClick={logout}>Sign out</button>
        </nav>
      </header>

      <section className="page-content company-profile-page">
        <p className="eyebrow">INDUSTRY WORKSPACE</p>
        <h1>Company Profile</h1>
        <p className="muted">Keep your company information up to date.</p>

        {loading ? (
          <div className="card company-profile-state" role="status">Loading company profile…</div>
        ) : error && !company ? (
          <div className="card company-profile-state" role="alert">
            <p className="error">{error}</p>
            <button onClick={() => setReloadKey((key) => key + 1)}>Try again</button>
          </div>
        ) : (
          <form className="card profile-form company-profile-form" onSubmit={saveProfile}>
            <div className="company-profile-heading">
              <div>
                <p className="eyebrow">COMPANY DETAILS</p>
                <p className={`industry-verification ${company?.isVerified ? "is-verified" : "is-pending"}`}>
                  <span className="industry-verification-dot" aria-hidden="true" />
                  {company?.isVerified ? "Verified" : "Pending Verification"}
                </p>
              </div>
              {!editing && <button type="button" onClick={() => { setEditing(true); setSuccess(""); }}>Edit profile</button>}
            </div>

            <div className="form-grid">
              {fields.map((field) => (
                <label key={field.name}>
                  {field.label}
                  {field.multiline ? (
                    <textarea
                      name={field.name}
                      value={form[field.name]}
                      onChange={updateField}
                      maxLength={field.maxLength}
                      disabled={!editing || saving}
                    />
                  ) : (
                    <input
                      name={field.name}
                      type={field.type}
                      value={form[field.name]}
                      onChange={updateField}
                      maxLength={field.maxLength}
                      required={field.required}
                      disabled={!editing || saving}
                    />
                  )}
                </label>
              ))}
            </div>

            {error && <p className="error" role="alert">{error}</p>}
            {success && <p className="company-profile-success" role="status">{success}</p>}

            {editing && (
              <div className="company-profile-actions">
                <button type="submit" disabled={saving}>{saving ? "Saving…" : "Save changes"}</button>
                <button className="secondary" type="button" onClick={cancelEdit} disabled={saving}>Cancel</button>
              </div>
            )}
          </form>
        )}
      </section>
    </main>
  );
}
