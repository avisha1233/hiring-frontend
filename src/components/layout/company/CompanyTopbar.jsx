import { Bell, Settings, LogOut, Search } from "lucide-react";

export default function CompanyTopbar({ title = "", userName = "", userEmail = "", userInitials = "TC", hasNotification = false, onLogout }) {
  return (
    <header className="fixed right-0 top-0 left-80 border-b border-orange-100 bg-white px-6 py-4 shadow-sm">
      <div className="flex items-center justify-between">
        {/* Title */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <p className="text-xs text-gray-500">Company Portal</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="flex items-center gap-2 rounded-lg border border-orange-100 bg-orange-50 px-3 py-2 text-xs text-gray-400">
            <Search size={14} className="text-gray-400" />
            Search…
          </div>

          {/* Bell */}
          <button className="relative rounded-full bg-orange-50 p-2 text-orange-600 hover:bg-orange-100">
            <Bell size={20} />
            {hasNotification && (
              <span className="absolute right-0 top-0 h-2 w-2 rounded-full bg-red-500" />
            )}
          </button>

          {/* Settings */}
          <button className="rounded-full bg-orange-50 p-2 text-orange-600 hover:bg-orange-100">
            <Settings size={20} />
          </button>

          <div className="h-8 w-px bg-orange-100" />

          {/* User info + avatar */}
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">{userName || "Company Admin"}</p>
              <p className="text-xs text-gray-500">{userEmail || "admin@hireiq.com"}</p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-100 text-xs font-semibold text-orange-600">
              {userInitials}
            </div>
          </div>

          {/* Logout */}
          <button
            onClick={onLogout}
            className="rounded-lg bg-orange-50 p-2 text-orange-600 hover:bg-orange-100"
            title="Logout"
          >
            <LogOut size={20} />
          </button>
        </div>
      </div>
    </header>
  );
}