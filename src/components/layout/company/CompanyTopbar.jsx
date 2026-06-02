import { useEffect, useState } from "react";
import { Bell, Settings, LogOut, Search } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import Avatar from "../../shared/Avatar";

const TITLE_MAP = {
  "/company/dashboard": "Overview",
  "/company/jobs": "Job Postings",
  "/company/applications": "Applications",
  "/company/candidates": "Candidates",
  "/company/interviews": "Interviews",
  "/company/messages": "Messages",
  "/company/profile": "Company Profile",
};

const SEARCH_TARGETS = {
  "/company/dashboard": "/company/candidates",
  "/company/applications": "/company/candidates",
  "/company/candidates": "/company/candidates",
  "/company/jobs": "/company/jobs",
};

// fix — removed userName and userEmail from props
// they were conflicting with the const declarations below
export default function CompanyTopbar({ hasNotification = false, onLogout }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const raw =
      localStorage.getItem("authUser") || localStorage.getItem("user");
    if (raw) {
      try {
        setUser(JSON.parse(raw));
      } catch {
        setUser(null);
      }
    }
  }, []);

  const title = TITLE_MAP[pathname] ?? "Company Dashboard";

  // these are now declared only once — no conflict
  const userName = user?.full_name || user?.name || "User";
  const userEmail = user?.email || "";

  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const handleSearch = () => {
    const query = window.prompt("Search company data");
    const searchTerm = query?.trim();
    if (!searchTerm) return;
    const targetPath = SEARCH_TARGETS[pathname] || "/company/candidates";
    navigate(`${targetPath}?search=${encodeURIComponent(searchTerm)}`);
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("authUser");
    localStorage.removeItem("token");
    if (onLogout) onLogout();
    navigate("/login");
  };

  return (
    <header className="fixed right-0 top-0 left-80 border-b border-orange-100 bg-white px-6 py-4 shadow-sm z-20">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <p className="text-xs text-gray-500">Company Dashboard</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleSearch}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-orange-200 bg-orange-50 px-4 text-sm font-medium text-orange-700 transition hover:bg-orange-100"
          >
            <Search size={16} className="text-orange-600" />
            Search
          </button>

          <button className="relative rounded-full bg-orange-50 p-2 text-orange-600 hover:bg-orange-100">
            <Bell size={18} />
            {hasNotification && (
              <span className="absolute right-0 top-0 h-2 w-2 rounded-full bg-red-500" />
            )}
          </button>

          <button
            onClick={() => navigate("/company/profile")}
            className="rounded-full bg-orange-50 p-2 text-orange-600 hover:bg-orange-100"
          >
            <Settings size={18} />
          </button>

          <div className="h-8 w-px bg-orange-100" />

          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">{userName}</p>
              <p className="text-xs text-gray-500">{userEmail}</p>
            </div>
            <Avatar name={initials} size="md" />
          </div>

          <button
            onClick={handleLogout}
            className="rounded-lg bg-orange-50 p-2 text-orange-600 hover:bg-orange-100"
            title="Logout"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </header>
  );
}
