import { useEffect, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { notificationService } from "../services/person4Service";
import Brand from "./Brand";

const navigation = {
  STUDENT: [
    { label: "Overview", to: "/dashboard/student", icon: "overview" },
    { label: "Opportunities", to: "/opportunities", icon: "opportunities" },
    { label: "Skills & learning", to: "/skills", icon: "skills" },
    { label: "Applications", to: "/applications", icon: "applications" },
    { label: "Interviews", to: "/interviews", icon: "calendar" },
    { label: "Internships", to: "/internships", icon: "work" },
    { label: "Placements", to: "/placements", icon: "placement" },
    { label: "My profile", to: "/profile", icon: "profile" },
  ],
  INDUSTRY: [
    { label: "Overview", to: "/industry", icon: "overview" },
    { label: "Opportunities", to: "/industry/opportunities", icon: "opportunities" },
    { label: "Applicants", to: "/industry/applicants", icon: "applications" },
    { label: "Interviews", to: "/industry/interviews", icon: "calendar" },
    { label: "Internships", to: "/industry/internships", icon: "work" },
    { label: "Company profile", to: "/industry/company", icon: "profile" },
  ],
  INSTITUTION: [
    { label: "Overview", to: "/dashboard/institution", icon: "overview" },
    { label: "Students", to: "/institution/students", icon: "profile" },
    { label: "Internships", to: "/institution/internships", icon: "work" },
    { label: "Placements", to: "/institution/placements", icon: "placement" },
    { label: "Placement insights", to: "/institution/placement-analytics", icon: "chart" },
    { label: "Institution profile", to: "/institution", icon: "building" },
  ],
  ADMIN: [
    { label: "Overview", to: "/dashboard/admin", icon: "overview" },
    { label: "Company review", to: "/admin/companies", icon: "building" },
    { label: "User management", to: "/admin/users", icon: "profile" },
    { label: "Placements", to: "/admin/placements", icon: "placement" },
  ],
};

const iconPaths = {
  overview: <><rect x="3.5" y="3.5" width="7" height="7" rx="1"/><rect x="13.5" y="3.5" width="7" height="7" rx="1"/><rect x="3.5" y="13.5" width="7" height="7" rx="1"/><rect x="13.5" y="13.5" width="7" height="7" rx="1"/></>,
  opportunities: <><circle cx="10" cy="10" r="7"/><path d="m15.5 15.5 4 4M10 6v8M6 10h8"/></>,
  skills: <><path d="M4 17.5 8.5 13l3 2.5L19 7"/><path d="M14.5 7H19v4.5"/><path d="M4 4.5v15h16"/></>,
  applications: <><path d="M6 3.5h8l4 4v13H6z"/><path d="M14 3.5v4h4M9 12h6M9 16h6"/></>,
  calendar: <><rect x="3.5" y="5" width="17" height="15" rx="2"/><path d="M7.5 3v4M16.5 3v4M3.5 9h17M8 13h3M8 16h2"/></>,
  work: <><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V4h8v3M3 12h18M10 12v2h4v-2"/></>,
  placement: <><path d="M4 19h16M6 16V9M10 16V5M14 16v-4M18 16V7"/><path d="m5 7 5-3 4 4 5-3"/></>,
  profile: <><circle cx="12" cy="8" r="3.5"/><path d="M5 20c.6-3.5 3.1-5.3 7-5.3s6.4 1.8 7 5.3"/></>,
  building: <><path d="M4 20V5l8-2 8 2v15M2.5 20h19"/><path d="M8 8h1M15 8h1M8 12h1M15 12h1M10 20v-4h4v4"/></>,
  bell: <><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/></>,
  logout: <><path d="M10 4H5v16h5M14 8l4 4-4 4M8 12h10"/></>,
};

function Icon({ name }) {
  return <svg className="nav-icon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">{iconPaths[name] || iconPaths.overview}</svg>;
}

function initials(name = "") {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "SB";
}

export default function WorkspaceShell({ children }) {
  const { user, logout } = useAuth();
  const [unread, setUnread] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const links = navigation[user?.role] || [];
  const roleName = ({ STUDENT: "Student", INDUSTRY: "Industry partner", INSTITUTION: "Institution", ADMIN: "Platform admin" })[user?.role] || "Workspace";
  const active = links.filter((item) => location.pathname === item.to || location.pathname.startsWith(`${item.to}/`)).sort((a, b) => b.to.length - a.to.length)[0];

  useEffect(() => {
    let current = true;
    notificationService.unreadCount().then(({ data }) => { if (current) setUnread(data.data.count || 0); }).catch(() => {});
    return () => { current = false; };
  }, [location.pathname]);

  useEffect(() => { setMenuOpen(false); }, [location.pathname]);

  const signOut = async () => { await logout(); navigate("/login", { replace: true }); };
  const navList = (items, className = "") => <nav className={className} aria-label="Main navigation">{items.map((item) => { const isActive = active?.to === item.to || location.pathname === item.to; return <NavLink key={item.to} to={item.to} className={`workspace-nav-link${isActive ? " is-active" : ""}`}><Icon name={item.icon}/><span>{item.label}</span>{item.label === "Notifications" && unread > 0 && <i className="nav-count">{unread}</i>}</NavLink>; })}</nav>;

  return (
    <div className="workspace-shell">
      <aside className="workspace-sidebar">
        <Brand to={links[0]?.to || "/home"} inverse />
        <div className="sidebar-section-label">WORKSPACE</div>
        {navList(links, "workspace-navigation")}
        <div className="sidebar-spacer" />
        <div className="sidebar-account"><span className="account-monogram">{initials(user?.fullName)}</span><span><strong>{user?.fullName}</strong><small>{roleName}</small></span><button aria-label="Sign out" title="Sign out" className="icon-button" onClick={signOut}><Icon name="logout"/></button></div>
      </aside>

      {menuOpen && <button className="mobile-scrim" aria-label="Close menu" onClick={() => setMenuOpen(false)} />}
      <aside className={`mobile-drawer${menuOpen ? " is-open" : ""}`} aria-hidden={!menuOpen}>
        <Brand to={links[0]?.to || "/home"} inverse />
        <div className="sidebar-section-label">WORKSPACE</div>
        {navList(links, "workspace-navigation")}
        <div className="sidebar-spacer" />
        <div className="sidebar-account"><span className="account-monogram">{initials(user?.fullName)}</span><span><strong>{user?.fullName}</strong><small>{roleName}</small></span><button aria-label="Sign out" title="Sign out" className="icon-button" onClick={signOut}><Icon name="logout"/></button></div>
      </aside>

      <div className="workspace-main">
        <header className="workspace-topbar">
          <button className="menu-toggle" aria-label={menuOpen ? "Close navigation" : "Open navigation"} aria-expanded={menuOpen} onClick={() => setMenuOpen((value) => !value)}><span/><span/></button>
          <div className="topbar-context"><span>{roleName}</span><strong>{active?.label || "Overview"}</strong></div>
          <div className="topbar-actions"><NavLink className="notification-link" to="/notifications" aria-label={unread ? `${unread} unread notifications` : "Notifications"}><Icon name="bell"/>{unread > 0 && <i>{unread}</i>}</NavLink><span className="topbar-divider"/><button className="topbar-profile" onClick={() => { const profilePath = ({ STUDENT: "/profile", INDUSTRY: "/industry/company", INSTITUTION: "/institution", ADMIN: "/admin/users" })[user?.role]; if (profilePath) navigate(profilePath); }} title="Open profile"><span className="account-monogram">{initials(user?.fullName)}</span><span>{user?.fullName?.split(" ")[0]}</span></button></div>
        </header>
        <div className="workspace-content">{children}</div>
      </div>
      <nav className="mobile-bottom-nav" aria-label="Quick navigation">{links.slice(0, 4).map((item) => <NavLink key={item.to} to={item.to} end className={`mobile-nav-item${active?.to === item.to ? " is-active" : ""}`}><Icon name={item.icon}/><span>{item.label}</span></NavLink>)}<button className="mobile-nav-item" onClick={() => setMenuOpen((value) => !value)}><span className="more-dots">···</span><span>More</span></button></nav>
    </div>
  );
}
