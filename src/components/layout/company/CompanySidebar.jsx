import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Briefcase, FileText, Users,
  CheckSquare, CalendarDays, Upload, MessageSquare,
  Settings, Zap, ChevronRight,
} from "lucide-react";

const links = [
  { label: "Overview",        icon: LayoutDashboard, path: "/company/overview" },
  { label: "Job Postings",    icon: Briefcase,       path: "/company/jobs",          badge: "jobs" },
  { label: "Applications",    icon: FileText,        path: "/company/applications",  badge: "applications" },
  { label: "Candidates",      icon: Users,           path: "/company/candidates" },
  { label: "Tasks",           icon: CheckSquare,     path: "/company/tasks" },
  { label: "Interviews",      icon: CalendarDays,    path: "/company/interviews",    badge: "interviews" },
  { label: "Submissions",     icon: Upload,          path: "/company/submissions" },
  { label: "Messages",        icon: MessageSquare,   path: "/company/messages",      badge: "messages" },
  { label: "Company Profile", icon: Settings,        path: "/company/profile" },
];

export default function Sidebar({ badges = {}, userName = "", userInitials = "TC" }) {
  const { pathname } = useLocation();

  return (
    /* FIXED: added zIndex: 30 so sidebar sits above topbar's z-20 and main content */
    <div style={{
      width: "210px", minWidth: "210px",
      background: "#fff",
      borderRight: "0.5px solid #FFD0B0",
      display: "flex", flexDirection: "column",
      height: "100vh",
      position: "fixed", top: 0, left: 0,
      zIndex: 30,   /* ← added */
    }}>

      {/* Logo */}
      <div style={{ padding: "16px 14px 12px", borderBottom: "0.5px solid #FFE8D6", display: "flex", alignItems: "center", gap: "10px" }}>
        <div style={{ width: "30px", height: "30px", borderRadius: "8px", background: "#F97316", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Zap size={15} color="#fff" />
        </div>
        <div>
          <div style={{ fontSize: "13px", fontWeight: 500 }}>HireIQ</div>
          <div style={{ fontSize: "10px", color: "#F97316" }}>Company Portal</div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "8px 7px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "1px" }}>
        <div style={{ fontSize: "10px", color: "#C2570A", opacity: 0.65, padding: "8px 8px 3px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
          Menu
        </div>
        {links.map((item) => {
          const active = pathname === item.path;
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              style={{
                display: "flex", alignItems: "center", gap: "9px",
                padding: "7px 10px", borderRadius: "8px", fontSize: "12px",
                color: active ? "#C2570A" : "#6b7280",
                fontWeight: active ? 500 : 400,
                background: active ? "#FFF5EE" : "transparent",
                textDecoration: "none",
              }}
            >
              <Icon size={15} color={active ? "#F97316" : "#9ca3af"} />
              <span style={{ flex: 1 }}>{item.label}</span>
              {item.badge && badges[item.badge] > 0 && (
                <span style={{ fontSize: "10px", padding: "1px 6px", borderRadius: "8px", background: "#FFE8D6", color: "#C2570A" }}>
                  {badges[item.badge]}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User footer */}
      <div style={{ padding: "10px", borderTop: "0.5px solid #FFE8D6" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "7px", borderRadius: "8px", cursor: "pointer" }}>
          <div style={{ width: "30px", height: "30px", borderRadius: "50%", background: "#FFE8D6", color: "#C2570A", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: 500, flexShrink: 0 }}>
            {userInitials}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: "12px", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {userName || "Company Admin"}
            </div>
            <div style={{ fontSize: "10px", color: "#6b7280" }}>Company Admin</div>
          </div>
          <ChevronRight size={13} color="#9ca3af" />
        </div>
      </div>

    </div>
  );
}