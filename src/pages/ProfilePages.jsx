import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/authService";
import { useAuth } from "../context/AuthContext";
function useProfile(endpoint) {
  const [profile, setProfile] = useState(null),
    [loading, setLoading] = useState(true),
    [error, setError] = useState("");
  useEffect(() => {
    api
      .get(endpoint)
      .then((r) => setProfile(r.data.data.profile))
      .catch((e) =>
        setError(e.response?.data?.message || "Could not load profile"),
      )
      .finally(() => setLoading(false));
  }, [endpoint]);
  return { profile, setProfile, loading, error };
}
const studentFields = [
  ["degree", "Degree"],
  ["department", "Department"],
  ["graduationYear", "Graduation year"],
  ["semester", "Current semester"],
  ["bio", "Bio"],
  ["linkedIn", "LinkedIn URL"],
  ["github", "GitHub URL"],
  ["portfolio", "Portfolio URL"],
  ["resumeUrl", "Resume URL"],
  ["profileImage", "Profile image URL"],
];
const institutionFields = [
  ["name", "Institution name"],
  ["officialEmail", "Official email"],
  ["website", "Website"],
  ["address", "Address"],
  ["description", "Description"],
  ["contactInfo", "Contact information"],
];
function Profile({ kind, edit = false }) {
  const student = kind === "student",
    endpoint = student ? "/students/me" : "/institutions/me",
    profileEndpoint = student ? "/students/profile" : "/institutions/profile";
  const { profile, setProfile, loading, error } = useProfile(endpoint),
    { user } = useAuth();
  const [form, setForm] = useState({}),
    [message, setMessage] = useState("");
  useEffect(() => {
    setForm(
      Object.fromEntries(
        (student ? studentFields : institutionFields).map(([key]) => [
          key,
          profile?.[key] ?? "",
        ]),
      ),
    );
  }, [profile, student]);
  if (loading) return <div className="center">Loading profile…</div>;
  if (error) return <div className="center error">{error}</div>;
  const fields = student ? studentFields : institutionFields;
  async function save(e) {
    e.preventDefault();
    try {
      const { data } = await api.patch(profileEndpoint, form);
      setProfile(data.data.profile);
      setMessage("Profile saved.");
    } catch (err) {
      setMessage(err.response?.data?.message || "Could not save changes");
    }
  }
  return (
    <main className="page">
      <header className="topbar">
        <Link to="/" className="logo">
          SB <span>SkillBridge AI</span>
        </Link>
        <nav>
          <span>{user?.fullName}</span>
          <Link to={edit ? "/profile" : `/profile/edit`}>
            {edit ? "View profile" : "Edit profile"}
          </Link>
        </nav>
      </header>
      <section className="page-content">
        <p className="eyebrow">
          {student ? "STUDENT PROFILE" : "INSTITUTION PROFILE"}
        </p>
        <h1>{student ? user?.fullName : profile?.name || user?.fullName}</h1>
        <p className="muted">
          {student
            ? user?.email
            : profile?.isVerified
              ? "Verified institution"
              : "Verification pending"}
        </p>
        {edit ? (
          <form className="card profile-form" onSubmit={save}>
            <div className="form-grid">
              {fields.map(([key, label]) => (
                <label key={key}>
                  {label}
                  {key === "bio" ||
                  key === "description" ||
                  key === "address" ||
                  key === "contactInfo" ? (
                    <textarea
                      value={form[key]}
                      onChange={(e) =>
                        setForm({ ...form, [key]: e.target.value })
                      }
                    />
                  ) : (
                    <input
                      type={
                        key === "graduationYear" || key === "semester"
                          ? "number"
                          : "text"
                      }
                      value={form[key]}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          [key]:
                            ["graduationYear", "semester"].includes(key) &&
                            e.target.value
                              ? Number(e.target.value)
                              : e.target.value,
                        })
                      }
                    />
                  )}
                </label>
              ))}
            </div>
            {message && <p className="muted">{message}</p>}
            <button>Save profile</button>
          </form>
        ) : (
          <section className="card profile-view">
            <dl>
              {fields.map(([key, label]) => (
                <div key={key}>
                  <dt>{label}</dt>
                  <dd>{profile?.[key] || "Not provided"}</dd>
                </div>
              ))}
            </dl>
            {student && (
              <>
                <FileUpload kind="resume" />
                <FileUpload kind="image" />
              </>
            )}
          </section>
        )}
      </section>
    </main>
  );
}
function FileUpload({ kind }) {
  const [notice, setNotice] = useState("");
  async function send(e) {
    e.preventDefault();
    const file = e.target.file.files[0];
    if (!file) return;
    const body = new FormData();
    body.append("file", file);
    try {
      await api.post(
        `/students/profile/${kind === "resume" ? "resume" : "image"}`,
        body,
      );
      setNotice("Upload complete. Refresh to see the updated link.");
    } catch (err) {
      setNotice(err.response?.data?.message || "Upload failed");
    }
  }
  return (
    <form className="upload-row" onSubmit={send}>
      <label>
        Upload {kind}
        <input
          name="file"
          type="file"
          accept={
            kind === "resume"
              ? ".pdf,application/pdf"
              : "image/png,image/jpeg,image/webp"
          }
          required
        />
      </label>
      <button className="secondary">Upload</button>
      {notice && <small>{notice}</small>}
    </form>
  );
}
export function StudentProfile() {
  return <Profile kind="student" />;
}
export function EditStudentProfile() {
  return <Profile kind="student" edit />;
}
export function InstitutionProfile() {
  return <Profile kind="institution" />;
}
export function EditInstitutionProfile() {
  return <Profile kind="institution" edit />;
}
