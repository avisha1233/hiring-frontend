import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Briefcase,
  FileText,
  Users,
  CalendarDays,
  MessageSquare,
  Settings,
  Layers,
} from "lucide-react";

export default function CompanySidebar() {
  const navItems = [
    { label: "Overview", icon: LayoutDashboard, to: "/company/dashboard" },
    { label: "Job Postings", icon: Briefcase, to: "/company/jobs" },
    { label: "Candidates", icon: Users, to: "/company/candidates" },
    { label: "Applications", icon: FileText, to: "/company/applications" },
    { label: "Interviews", icon: CalendarDays, to: "/company/interviews" },
    { label: "Messages", icon: MessageSquare, to: "/company/messages" },
    { label: "Company Profile", icon: Settings, to: "/company/profile" },
  ];

  return (
    <aside className="fixed left-0 top-0 h-screen w-80 overflow-y-auto bg-orange-600 text-orange-100">
      <div className="sticky top-0 border-b border-orange-500 bg-orange-600 px-6 py-6">
        <h1 className="text-2xl font-bold text-white">Smart Hiring</h1>
        <p className="mt-1 text-xs text-orange-200">Company Dashboard</p>
      </div>

      <nav className="space-y-6 px-4 py-6">
        <div>
          <div className="mt-3 space-y-1">
            {navItems.map(({ icon: Icon, label, to }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-4 py-2 text-sm font-medium transition ${isActive
                    ? "bg-white text-orange-600"
                    : "text-orange-100 hover:bg-orange-500"
                  }`
                }
              >
                <Icon size={18} />
                {label}
              </NavLink>
            ))}
          </div>
        </div>
      </nav>
    </aside>
  );
}
