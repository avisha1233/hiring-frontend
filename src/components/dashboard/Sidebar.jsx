import {
  BriefcaseBusiness,
  Building2,
  Grid2X2,
  LogOut,
  Settings,
  Users,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useLocation, Link } from "@tanstack/react-router";

const NAV_ITEMS = [
  { key: "overview", label: "Overview", icon: Grid2X2, href: "/" },
  { key: "users", label: "Users", icon: Users, href: "/users" },
  { key: "companies", label: "Companies", icon: Building2, href: "/companies" },
  { key: "jobs", label: "Jobs", icon: BriefcaseBusiness, href: "/jobs" },
  { key: "settings", label: "Settings", icon: Settings, href: "/settings" },
];

export function Sidebar({
  collapsed,
  onToggle,
  mobileOpen,
  onCloseMobile,
  user,
  onLogout,
}) {
  const location = useLocation();

  const isActive = (href) => {
    if (href === "/" && location.pathname === "/") return true;
    if (href !== "/" && location.pathname.startsWith(href)) return true;
    return false;
  };
  return (
    <>
      <div
        className={`fixed inset-0 z-30 bg-(--dash-overlay) transition-opacity duration-300 lg:hidden ${
          mobileOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={onCloseMobile}
      />

      <aside
        className={`fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-(--dash-border) bg-(--dash-bg-elevated) shadow-(--dash-shadow) transition-all duration-300 ease-out lg:translate-x-0 ${
          collapsed ? "w-23" : "w-80"
        } ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex h-19.5 items-center border-b border-(--dash-border) px-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-(--dash-accent) text-white">
            {">_"}
          </div>

          {!collapsed && (
            <div className="ml-3">
              <p className="m-0 text-lg font-semibold leading-none text-(--dash-text)">
                Smart Hiring system
              </p>
              <p className="m-0 text-sm text-(--dash-muted)">admin</p>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={onToggle}
          className="absolute -right-4 top-24 hidden h-8 w-8 items-center justify-center rounded-full border border-(--dash-border) bg-(--dash-bg-elevated) text-(--dash-muted) transition hover:bg-(--dash-accent-soft) hover:text-(--dash-accent) lg:flex"
          aria-label="Toggle sidebar"
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>

        <nav className="mt-5 flex-1 space-y-1 px-2">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.key}
                to={item.href}
                className={`group flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left transition-all duration-300 no-underline ${
                  active
                    ? "bg-(--dash-accent-soft) text-(--dash-accent)"
                    : "text-(--dash-muted) hover:bg-(--dash-accent-soft) hover:text-(--dash-accent)"
                }`}
              >
                <Icon size={20} />
                {!collapsed && <span className="text-base">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-(--dash-border) p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-(--dash-accent-soft) text-(--dash-accent)">
              AD
            </div>

            {!collapsed && (
              <div>
                <p className="m-0 text-base font-semibold text-(--dash-text)">
                  {user?.full_name || "Admin User"}
                </p>
                <p className="m-0 text-sm text-(--dash-muted)">
                  {user?.email || "admin@example.com"}
                </p>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={onLogout}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-(--dash-border) px-3 py-2 text-(--dash-muted) transition hover:border-(--dash-accent) hover:bg-(--dash-accent-soft) hover:text-(--dash-accent)"
          >
            <LogOut size={16} />
            {!collapsed && <span className="text-base">Logout</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
