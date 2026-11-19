import { Link } from "react-router-dom";

export function BridgeMark({ className = "", title = "SkillBridge" }) {
  return (
    <svg className={`bridge-mark ${className}`} viewBox="0 0 48 48" role="img" aria-label={title} fill="none">
      <path d="M7 29.5h34M11 29.5v11M37 29.5v11M11 29.5c1.9-12.1 6.3-18.2 13-18.2s11.1 6.1 13 18.2" stroke="currentColor" strokeWidth="2.7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M19 29.5v5.2M29 29.5v5.2" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      <circle cx="24" cy="11.3" r="2.2" fill="var(--brand-accent, #c65b3d)" />
    </svg>
  );
}

export default function Brand({ to = "/", inverse = false, compact = false, onClick }) {
  const content = <><BridgeMark /><span className="brand-wordmark">SkillBridge<small>AI</small></span></>;
  const className = `brand-lockup${inverse ? " brand-lockup-inverse" : ""}${compact ? " brand-lockup-compact" : ""}`;
  return onClick ? <button type="button" className={className} onClick={onClick}>{content}</button> : <Link to={to} className={className} aria-label="SkillBridge AI home">{content}</Link>;
}
