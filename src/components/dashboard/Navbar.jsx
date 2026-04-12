import { Menu, Search } from "lucide-react";
import { NotificationMenu } from "@/components/notifications/NotificationMenu";

export function Navbar({ onMenuClick }) {
  return (
    <header className="flex h-[78px] items-center justify-between border-b border-[var(--dash-border)] bg-[var(--dash-bg-elevated)] px-4 sm:px-8">
      <div>
        <h1 className="m-0 text-2xl font-semibold leading-none text-[var(--dash-text)] sm:text-3xl">
          Dashboard
        </h1>
        <p className="m-0 text-xs text-[var(--dash-muted)] sm:text-sm">
          Welcome back. Here&apos;s an overview of your platform.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--dash-border)] text-[var(--dash-muted)] transition hover:bg-[var(--dash-accent-soft)] hover:text-[var(--dash-accent)] lg:hidden"
          aria-label="Open sidebar"
        >
          <Menu size={18} />
        </button>

        <div className="hidden h-11 items-center gap-2 rounded-xl border border-[var(--dash-border)] bg-[var(--dash-surface)] px-3 text-[var(--dash-muted)] sm:flex">
          <Search size={16} />
          <input
            placeholder="Search..."
            className="w-[260px] bg-transparent text-sm text-[var(--dash-text)] outline-none placeholder:text-[var(--dash-muted)]"
          />
          <span className="rounded-md border border-[var(--dash-border)] px-2 py-1 text-xs">
            K
          </span>
        </div>

        <NotificationMenu />
      </div>
    </header>
  );
}
