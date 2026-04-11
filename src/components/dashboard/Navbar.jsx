import { Bell, Menu, Search } from "lucide-react";

export function Navbar({ onMenuClick, notificationCount = 0 }) {
  return (
    <header className="flex h-[78px] items-center justify-between border-b border-[#131f31] bg-[#04080f] px-4 sm:px-8">
      <div>
        <h1 className="m-0 text-2xl font-semibold leading-none text-white sm:text-3xl">
          Dashboard
        </h1>
        <p className="m-0 text-xs text-[#8096b4] sm:text-sm">
          Welcome back. Here&apos;s an overview of your platform.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[#1a2739] text-[#8ba0bc] transition hover:text-white lg:hidden"
          aria-label="Open sidebar"
        >
          <Menu size={18} />
        </button>

        <div className="hidden h-11 items-center gap-2 rounded-xl border border-[#1a2739] bg-[#060c16] px-3 text-[#7d92ae] sm:flex">
          <Search size={16} />
          <input
            placeholder="Search..."
            className="w-[260px] bg-transparent text-sm outline-none"
          />
          <span className="rounded-md border border-[#213149] px-2 py-1 text-xs">
            K
          </span>
        </div>

        <button
          type="button"
          className="relative inline-flex h-10 w-10 items-center justify-center rounded-full text-[#c8d7ea] transition hover:bg-[#101b2b]"
          aria-label="Notifications"
        >
          <Bell size={18} />
          {notificationCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#00d09c] px-1 text-xs font-semibold text-[#042b1f]">
              {notificationCount > 99 ? "99+" : notificationCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}
