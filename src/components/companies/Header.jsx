import { Menu } from "lucide-react";
import { SearchBar } from "@/components/companies/SearchBar";
import { Button } from "@/components/companies/Button";
import { NotificationMenu } from "@/components/notifications/NotificationMenu";

export function Header({
  title,
  subtitle,
  headerSearch,
  onHeaderSearch,
  onMenuClick,
}) {
  return (
    <header className="flex min-h-19.5 flex-wrap items-center justify-between gap-4 border-b border-(--dash-border) bg-(--dash-bg-elevated) px-4 py-3 sm:px-8">
      <div>
        <h1 className="m-0 text-2xl font-semibold leading-tight text-(--dash-text) sm:text-3xl">
          {title}
        </h1>
        <p className="m-0 mt-1 text-sm text-(--dash-muted)">{subtitle}</p>
      </div>

      <div className="flex w-full items-center justify-end gap-3 sm:w-auto">
        <Button
          size="icon"
          variant="outline"
          className="lg:hidden"
          onClick={onMenuClick}
          aria-label="Open sidebar"
        >
          <Menu size={18} />
        </Button>

        <SearchBar
          value={headerSearch}
          onChange={onHeaderSearch}
          placeholder="Search..."
          className="hidden w-65 sm:flex"
        />

        <NotificationMenu />
      </div>
    </header>
  );
}

