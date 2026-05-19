import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Briefcase,
  FileText,
  CalendarDays,
  Folder,
  MessageCircle,
  User,
  CreditCard,
  Settings,
  Bell,
} from "lucide-react";

export default function CandidateSidebar() {
  const navItems = [
    { icon: LayoutDashboard, label: "Overview", to: "/candidate/dashboard" },
    { icon: Briefcase, label: "Browse Jobs", to: "/candidate/jobs" },
    { icon: FileText, label: "My Applications", to: "/candidate/applications" },
    { icon: CalendarDays, label: "Interviews", to: "/candidate/interviews" },
    { icon: CreditCard, label: "Submissions", to: "/candidate/submissions" },
    { icon: User, label: "Profile", to: "/candidate/profile" },
    { icon: MessageCircle, label: "Messages", to: "/candidate/messages" },
    { icon: Bell, label: "Notifications", to: "/candidate/notifications" },
    { icon: Folder, label: "Files", to: "/candidate/files" },
    { icon: Settings, label: "Settings", to: "/candidate/settings" },
  ];

  return (
    <aside className="fixed left-0 top-0 h-screen w-80 overflow-y-auto bg-orange-600 text-orange-100">
      <div className="sticky top-0 border-b border-orange-500 bg-orange-600 px-6 py-6">
        <h1 className="text-2xl font-bold text-white">Smart Hiring</h1>
        <p className="mt-1 text-xs text-orange-200">Candidate Dashboard</p>
      </div>

      <nav className="space-y-6 px-4 py-6">
        <div>
          <div className="mt-3 space-y-1">
            {navItems.map(({ icon: Icon, label, to }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-4 py-2 text-sm font-medium transition ${
                    isActive
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
