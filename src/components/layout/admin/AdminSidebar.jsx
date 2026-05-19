import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Building2,
  UserCheck,
  ShieldX,
  Briefcase,
  Code2,
  FileText,
  CalendarDays,
  Upload,
  Bell,
  Folder,
  MessageCircle,
  BarChart3,
  Settings,
} from "lucide-react";

export default function AdminSidebar() {
  const navItems = [
    {
      section: "MAIN",
      items: [
        { icon: LayoutDashboard, label: "Overview", to: "/admin/dashboard" },
      ],
    },
    {
      section: "USER MANAGEMENT",
      items: [
        { icon: Users, label: "All Users", to: "/admin/users" },
        { icon: Building2, label: "Companies", to: "/admin/companies" },
        { icon: UserCheck, label: "Candidates", to: "/admin/candidates" },
        { icon: ShieldX, label: "Blocked Accounts", to: "/admin/blocked" },
      ],
    },
    {
      section: "CONTENT",
      items: [
        { icon: Briefcase, label: "Jobs", to: "/admin/jobs" },
        { icon: Code2, label: "Skills", to: "/admin/skills" },
        { icon: FileText, label: "Applications", to: "/admin/applications" },
      ],
    },
    {
      section: "OPERATIONS",
      items: [
        { icon: CalendarDays, label: "Interviews", to: "/admin/interviews" },
        { icon: Upload, label: "Submissions", to: "/admin/submissions" },
        { icon: Bell, label: "Notifications", to: "/admin/notifications" },
        { icon: Folder, label: "Files", to: "/admin/files" },
        { icon: MessageCircle, label: "Messages", to: "/admin/messages" },
      ],
    },
    {
      section: "ANALYTICS & SYSTEM",
      items: [
        { icon: BarChart3, label: "Reports", to: "/admin/reports" },
        { icon: Settings, label: "Settings", to: "/admin/settings" },
      ],
    },
  ];

  return (
    <aside className="fixed left-0 top-0 h-screen w-80 overflow-y-auto bg-orange-600 text-orange-100">
      <div className="sticky top-0 border-b border-orange-500 bg-orange-600 px-6 py-6">
        <h1 className="text-2xl font-bold text-white"> Admin</h1>
        <p className="mt-1 text-xs text-orange-200">Smart Hiring Platform</p>
      </div>

      <nav className="space-y-6 px-4 py-6">
        {navItems.map((group) => (
          <div key={group.section}>
            <h3 className="px-2 text-xs font-semibold uppercase tracking-wider text-orange-300">
              {group.section}
            </h3>
            <div className="mt-3 space-y-1">
              {group.items.map(({ icon: Icon, label, to }) => (
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
        ))}
      </nav>
    </aside>
  );
}
