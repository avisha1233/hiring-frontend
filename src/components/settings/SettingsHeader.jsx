import { Menu, Search } from "lucide-react";
import { NotificationMenu } from "@/components/notifications/NotificationMenu";

export function SettingsHeader({ onMenuClick, searchValue, onSearchChange }) {
  return (
    <header className="flex min-h-20 flex-wrap items-center justify-between gap-3 border-b border-(--dash-border) bg-(--dash-bg-elevated) px-4 py-3 sm:px-8">
      <div>
        <h1 className="m-0 text-lg font-semibold leading-none text-(--dash-text) sm:text-4xl">
          Settings
        </h1>
        <p className="m-0 mt-1 text-sm text-(--dash-muted)">
          Manage platform configuration and preferences
        </p>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-(--dash-border) text-(--dash-muted) transition hover:bg-(--dash-accent-soft) hover:text-(--dash-accent) lg:hidden"
          aria-label="Open sidebar"
        >
          <Menu size={18} />
        </button>

        <div className="hidden h-11 items-center gap-2 rounded-xl border border-(--dash-border) bg-(--dash-surface) px-3 text-(--dash-muted) sm:flex">
          <Search size={16} />
          <input
            value={searchValue}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search..."
            className="w-70 bg-transparent text-sm text-(--dash-text) outline-none placeholder:text-(--dash-muted)"
          />
          <span className="rounded-md border border-(--dash-border) px-2 py-1 text-xs">
            K
          </span>
        </div>

        <NotificationMenu />
      </div>
    </header>
  );
}
