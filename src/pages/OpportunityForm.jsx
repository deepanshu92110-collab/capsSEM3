import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { industryService } from "../services/industryService";

const opportunityTypes = ["INTERNSHIP", "JOB", "PROJECT"];
const workModes = ["ONSITE", "HYBRID", "REMOTE"];
const emptyForm = {
  title: "",
  type: "",
  description: "",
  responsibilities: "",
  qualifications: "",
  location: "",
  workMode: "",
  compensation: "",
  openings: "1",
  applicationUrl: "",
  applicationDeadline: "",
  startDate: "",
  endDate: "",
};
const textLimits = {
  title: 200,
  description: 10000,
  responsibilities: 5000,
  qualifications: 5000,
  location: 200,
  compensation: 200,
  applicationUrl: 2048,
};

function toLocalDateTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 16);
}

function parseLocalDateTime(value) {
  if (!value) return { date: null };
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/);
  if (!match) return { error: "Enter a valid date and time." };
  const [, yearText, monthText, dayText, hourText, minuteText] = match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const hour = Number(hourText);
  const minute = Number(minuteText);
  const leapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const monthDays = [31, leapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (year < 1 || month < 1 || month > 12 || day < 1 || day > monthDays[month - 1] || hour > 23 || minute > 59)
    return { error: "Enter a real calendar date and time." };
  const date = new Date(year, month - 1, day, hour, minute);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day || date.getHours() !== hour || date.getMinutes() !== minute)
    return { error: "Enter a real local date and time." };
  return { date };
}

function validHttpUrl(value) {
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) && Boolean(url.hostname) && !url.username && !url.password;
  } catch {
    return false;
  }
}

function makeForm(opportunity) {
  return {
    title: opportunity.title || "",
    type: opportunity.type || "",
    description: opportunity.description || "",
    responsibilities: opportunity.responsibilities || "",
    qualifications: opportunity.qualifications || "",
    location: opportunity.location || "",
    workMode: opportunity.workMode || "",
    compensation: opportunity.compensation || "",
    openings: String(opportunity.openings ?? 1),
    applicationUrl: opportunity.applicationUrl || "",
    applicationDeadline: toLocalDateTime(opportunity.applicationDeadline),
    startDate: toLocalDateTime(opportunity.startDate),
    endDate: toLocalDateTime(opportunity.endDate),
  };
}

function validateForm(form) {
  if (!form.title.trim()) return "Title is required.";
  if (form.title.trim().length > textLimits.title) return `Title must be at most ${textLimits.title} characters.`;
  if (!opportunityTypes.includes(form.type)) return "Select an opportunity type.";
  if (!form.description.trim()) return "Description is required.";
  if (form.description.trim().length > textLimits.description) return `Description must be at most ${textLimits.description} characters.`;

  for (const [field, limit] of Object.entries(textLimits)) {
    if (form[field].trim().length > limit) return `${field[0].toUpperCase() + field.slice(1)} must be at most ${limit} characters.`;
  }
  if (form.workMode && !workModes.includes(form.workMode)) return "Select a valid work mode.";
  const openings = Number(form.openings);
  if (!Number.isInteger(openings) || openings < 1 || openings > 10000)
    return "Openings must be a whole number between 1 and 10,000.";
  if (form.applicationUrl.trim() && !validHttpUrl(form.applicationUrl.trim()))
    return "Application URL must be a complete HTTP or HTTPS URL without embedded credentials.";

  const deadline = parseLocalDateTime(form.applicationDeadline);
  if (deadline.error) return `Application deadline: ${deadline.error}`;
  if (deadline.date && deadline.date <= new Date()) return "Application deadline must be in the future.";
  const startDate = parseLocalDateTime(form.startDate);
  if (startDate.error) return `Start date: ${startDate.error}`;
  const endDate = parseLocalDateTime(form.endDate);
  if (endDate.error) return `End date: ${endDate.error}`;
  if (startDate.date && endDate.date && endDate.date < startDate.date)
    return "End date must be on or after the start date.";
  return "";
}

function makePayload(form) {
  const dateValue = (value) => value ? parseLocalDateTime(value).date.toISOString() : null;
  return {
    title: form.title.trim(),
    type: form.type,
    description: form.description.trim(),
    responsibilities: form.responsibilities.trim() || null,
    qualifications: form.qualifications.trim() || null,
    location: form.location.trim() || null,
    workMode: form.workMode || null,
    compensation: form.compensation.trim() || null,
    openings: Number(form.openings),
    applicationUrl: form.applicationUrl.trim() || null,
    applicationDeadline: dateValue(form.applicationDeadline),
    startDate: dateValue(form.startDate),
    endDate: dateValue(form.endDate),
  };
}

function errorMessage(error) {
  return error.response?.data?.message || "Could not save the opportunity. Please try again.";
}

export default function OpportunityForm() {
  const { id } = useParams();
  const editing = Boolean(id);
  const { user, logout } = useAuth();
  const [form, setForm] = useState(emptyForm);
  const [opportunity, setOpportunity] = useState(null);
  const [loading, setLoading] = useState(editing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!editing) return undefined;
    let cancelled = false;
    async function loadOpportunity() {
      setLoading(true);
      setError("");
      try {
        const response = await industryService.getOpportunity(id);
        if (cancelled) return;
        const loadedOpportunity = response.data.data.opportunity;
        setOpportunity(loadedOpportunity);
        setForm(makeForm(loadedOpportunity));
      } catch (loadError) {
        if (!cancelled) setError(errorMessage(loadError));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadOpportunity();
    return () => {
      cancelled = true;
    };
  }, [editing, id, reloadKey]);

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setError("");
    setSuccess("");
    setSaved(false);
  }

  async function submitForm(event) {
    event.preventDefault();
    if (saving || saved) return;
    const validationError = validateForm(form);
    if (validationError) {
      setError(validationError);
      setSuccess("");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const payload = makePayload(form);
      if (editing) await industryService.updateOpportunity(id, payload);
      else await industryService.createOpportunity(payload);
      setSaved(true);
      setSuccess(editing ? "Opportunity changes saved." : "Opportunity created as a draft.");
    } catch (saveError) {
      setError(errorMessage(saveError));
    } finally {
      setSaving(false);
    }
  }

  const archived = opportunity?.status === "ARCHIVED";

  return (
    <main className="page">
      <header className="topbar">
        <Link to="/industry" className="logo">SB <span>SkillBridge AI</span></Link>
        <nav>
          <span>{user?.fullName} · INDUSTRY</span>
          <Link to="/industry">Dashboard</Link>
          <Link to="/industry/opportunities">Manage Opportunities</Link>
          <button className="text-button" onClick={logout}>Sign out</button>
        </nav>
      </header>

      <section className="page-content opportunity-form-page">
        <p className="eyebrow">INDUSTRY WORKSPACE</p>
        <h1>{editing ? "Edit Opportunity" : "Create Opportunity"}</h1>
        <p className="muted">Add clear details so students can understand the opportunity.</p>

        {loading ? (
          <div className="card opportunity-form-state" role="status">Loading opportunity…</div>
        ) : archived ? (
          <div className="card opportunity-form-state" role="alert">
            <p className="error">Archived opportunities cannot be edited.</p>
            <Link className="button-link" to="/industry/opportunities">Back to opportunities</Link>
          </div>
        ) : error && editing && !opportunity ? (
          <div className="card opportunity-form-state" role="alert">
            <p className="error">{error}</p>
            <button onClick={() => setReloadKey((key) => key + 1)}>Try again</button>
            <Link className="industry-inline-link" to="/industry/opportunities">Back to opportunities</Link>
          </div>
        ) : (
          <form className="card profile-form opportunity-form" noValidate onSubmit={submitForm}>
            {editing && <p className="opportunity-form-status">Current status: <strong>{opportunity?.status}</strong></p>}

            <div className="form-grid">
              <label>
                Title <span className="required-mark">*</span>
                <input name="title" value={form.title} onChange={updateField} maxLength={textLimits.title} required disabled={saving || saved} />
              </label>
              <label>
                Type <span className="required-mark">*</span>
                <select name="type" value={form.type} onChange={updateField} required disabled={saving || saved}>
                  <option value="">Select type</option>
                  {opportunityTypes.map((type) => <option value={type} key={type}>{type}</option>)}
                </select>
              </label>
              <label className="opportunity-form-full-width">
                Description <span className="required-mark">*</span>
                <textarea name="description" value={form.description} onChange={updateField} maxLength={textLimits.description} required disabled={saving || saved} />
              </label>
              <label>
                Responsibilities
                <textarea name="responsibilities" value={form.responsibilities} onChange={updateField} maxLength={textLimits.responsibilities} disabled={saving || saved} />
              </label>
              <label>
                Qualifications
                <textarea name="qualifications" value={form.qualifications} onChange={updateField} maxLength={textLimits.qualifications} disabled={saving || saved} />
              </label>
              <label>
                Location
                <input name="location" value={form.location} onChange={updateField} maxLength={textLimits.location} disabled={saving || saved} />
              </label>
              <label>
                Work mode
                <select name="workMode" value={form.workMode} onChange={updateField} disabled={saving || saved}>
                  <option value="">Select work mode</option>
                  {workModes.map((mode) => <option value={mode} key={mode}>{mode}</option>)}
                </select>
              </label>
              <label>
                Compensation
                <input name="compensation" value={form.compensation} onChange={updateField} maxLength={textLimits.compensation} disabled={saving || saved} />
              </label>
              <label>
                Number of openings
                <input name="openings" type="number" min="1" max="10000" step="1" value={form.openings} onChange={updateField} disabled={saving || saved} />
              </label>
              <label className="opportunity-form-full-width">
                Application URL
                <input name="applicationUrl" type="url" value={form.applicationUrl} onChange={updateField} maxLength={textLimits.applicationUrl} placeholder="https://example.com/apply" disabled={saving || saved} />
              </label>
              <label>
                Application deadline
                <input name="applicationDeadline" type="datetime-local" value={form.applicationDeadline} onChange={updateField} disabled={saving || saved} />
              </label>
              <label>
                Start date
                <input name="startDate" type="datetime-local" value={form.startDate} onChange={updateField} disabled={saving || saved} />
              </label>
              <label>
                End date
                <input name="endDate" type="datetime-local" value={form.endDate} onChange={updateField} disabled={saving || saved} />
              </label>
            </div>

            {error && <p className="error opportunity-form-message" role="alert">{error}</p>}
            {success && <div className="opportunity-form-success" role="status">
              <p>{success}</p>
              <Link className="industry-inline-link" to="/industry/opportunities">Return to Manage Opportunities →</Link>
            </div>}

            <div className="opportunity-form-actions">
              <button type="submit" disabled={saving || saved}>{saving ? "Saving…" : editing ? "Save changes" : "Create draft"}</button>
              <Link className="button-link opportunity-cancel" to="/industry/opportunities">Cancel</Link>
            </div>
            {!editing && <p className="muted opportunity-draft-note">New opportunities are saved as drafts. Publish them later from Manage Opportunities.</p>}
          </form>
        )}
      </section>
    </main>
  );
}
