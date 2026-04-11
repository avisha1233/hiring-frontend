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
        className={`fixed inset-0 z-30 bg-black/60 transition-opacity duration-300 lg:hidden ${
          mobileOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={onCloseMobile}
      />

      <aside
        className={`fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-[#131f31] bg-[#04080f] transition-all duration-300 ease-out lg:translate-x-0 ${
          collapsed ? "w-[92px]" : "w-[320px]"
        } ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex h-[78px] items-center border-b border-[#131f31] px-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#00d09c] text-[#041412]">
            {">_"}
          </div>

          {!collapsed && (
            <div className="ml-3">
              <p className="m-0 text-lg font-semibold leading-none text-white">
                HR Platform
              </p>
              <p className="m-0 text-sm text-[#8ca0bc]">admin</p>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={onToggle}
          className="absolute -right-4 top-[96px] hidden h-8 w-8 items-center justify-center rounded-full border border-[#1b2a40] bg-[#04080f] text-[#9cb0cb] transition hover:text-white lg:flex"
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
                    ? "bg-[#0a121f] text-[#00d09c]"
                    : "text-[#8fa3be] hover:bg-[#0a121f] hover:text-white"
                }`}
              >
                <Icon size={20} />
                {!collapsed && <span className="text-base">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-[#131f31] p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#101927] text-[#b9cae1]">
              AD
            </div>

            {!collapsed && (
              <div>
                <p className="m-0 text-base font-semibold text-white">
                  {user?.full_name || "Admin User"}
                </p>
                <p className="m-0 text-sm text-[#8fa3be]">
                  {user?.email || "admin@example.com"}
                </p>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={onLogout}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-[#1b2a40] px-3 py-2 text-[#a8bbd5] transition hover:border-[#2f4665] hover:text-white"
          >
            <LogOut size={16} />
            {!collapsed && <span className="text-base">Logout</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
