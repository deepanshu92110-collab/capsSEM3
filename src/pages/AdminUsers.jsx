import { useEffect, useMemo, useState } from "react";
import { userService } from "../services/userService";

const roleLabels = { STUDENT: "Student", INDUSTRY: "Industry", INSTITUTION: "Institution", ADMIN: "Admin" };

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [query, setQuery] = useState("");
  const [role, setRole] = useState("ALL");
  const [status, setStatus] = useState("ALL");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = async () => {
    setLoading(true); setError("");
    try { const { data } = await userService.list(); setUsers(data.data.users); }
    catch (e) { setError(e.response?.data?.message || "Could not load platform users."); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);
  useEffect(() => { setPage(1); }, [query, role, status]);

  const filtered = useMemo(() => users.filter((user) => {
    const matchesQuery = `${user.fullName} ${user.email}`.toLowerCase().includes(query.trim().toLowerCase());
    return matchesQuery && (role === "ALL" || user.role === role) && (status === "ALL" || (status === "ACTIVE" ? user.isActive : !user.isActive));
  }), [users, query, role, status]);
  const pageSize = 12;
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const visibleUsers = filtered.slice((page - 1) * pageSize, page * pageSize);

  const toggleStatus = async (user) => {
    const nextStatus = !user.isActive;
    const action = nextStatus ? "restore access to" : "pause access for";
    if (!window.confirm(`Are you sure you want to ${action} ${user.fullName}?`)) return;
    setBusyId(user.id); setError(""); setNotice("");
    try {
      const { data } = await userService.setActive(user.id, nextStatus);
      setUsers((all) => all.map((item) => item.id === user.id ? data.data.user : item));
      setNotice(`${user.fullName}'s account is now ${user.isActive ? "paused" : "active"}.`);
    } catch (e) { setError(e.response?.data?.message || "Could not update this account."); }
    finally { setBusyId(""); }
  };

  return <main className="page"><header className="topbar"/><section className="page-content admin-users-page"><p className="eyebrow">PLATFORM DIRECTORY</p><div className="page-heading-row"><div><h1>User management</h1><p className="muted">Search platform accounts and manage access status.</p></div><span className="record-count">{filtered.length} <small>of {users.length} users</small></span></div>
    {error && <div className="feedback feedback-error" role="alert"><p>{error}</p>{!users.length&&<button className="button button-secondary" onClick={load}>Try again</button>}</div>}
    {notice && <p className="feedback feedback-success" role="status">{notice}</p>}
    <section className="directory-controls" aria-label="Filter users"><label className="search-field"><span className="sr-only">Search users by name or email</span><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 4 4"/></svg><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by name or email"/></label><label><span className="sr-only">Filter by role</span><select value={role} onChange={(e) => setRole(e.target.value)}><option value="ALL">All roles</option>{Object.entries(roleLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label><span className="sr-only">Filter by account status</span><select value={status} onChange={(e) => setStatus(e.target.value)}><option value="ALL">All accounts</option><option value="ACTIVE">Active</option><option value="INACTIVE">Paused</option></select></label></section>
    {loading ? <div className="skeleton-list" role="status" aria-label="Loading users"><span/><span/><span/><span/></div> : filtered.length ? <><div className="directory-table-wrap"><table className="directory-table"><thead><tr><th scope="col">Person</th><th scope="col">Role</th><th scope="col">Joined</th><th scope="col">Status</th><th scope="col"><span className="sr-only">Account action</span></th></tr></thead><tbody>{visibleUsers.map((user) => <tr key={user.id}><td data-label="Person"><div className="directory-person"><span className="account-monogram">{user.fullName.split(/\s+/).slice(0,2).map((part)=>part[0]).join("").toUpperCase()}</span><span><strong>{user.fullName}</strong><small>{user.email}</small></span></div></td><td data-label="Role"><span className={`role-tag role-${user.role.toLowerCase()}`}>{roleLabels[user.role] || user.role}</span></td><td data-label="Joined">{new Date(user.createdAt).toLocaleDateString()}</td><td data-label="Status"><span className={`account-status ${user.isActive ? "account-active" : "account-paused"}`}><i/>{user.isActive ? "Active" : "Paused"}</span></td><td data-label="Action"><button className={`table-action ${user.isActive ? "table-action-danger" : ""}`} disabled={busyId === user.id || user.role === "ADMIN"} onClick={() => toggleStatus(user)}>{busyId === user.id ? "Saving…" : user.isActive ? "Pause access" : "Restore access"}</button></td></tr>)}</tbody></table></div>{totalPages>1&&<nav className="opportunity-pagination" aria-label="User pages"><button className="button-secondary" disabled={page<=1} onClick={()=>setPage((value)=>value-1)}>Previous</button><span>Page {page} of {totalPages} · {filtered.length} accounts</span><button className="button-secondary" disabled={page>=totalPages} onClick={()=>setPage((value)=>value+1)}>Next</button></nav>}</> : <section className="empty-state directory-empty"><span className="empty-mark">⌕</span><h2>{users.length ? "No matching users" : "No user accounts yet"}</h2><p>{users.length ? "Try another name, email, role or account status." : "Platform accounts will appear here after registration."}</p>{(query || role !== "ALL" || status !== "ALL") && <button className="button button-secondary" onClick={() => { setQuery(""); setRole("ALL"); setStatus("ALL"); }}>Clear filters</button>}</section>}
  </section></main>;
}
