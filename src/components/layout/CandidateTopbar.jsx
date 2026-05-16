import { Bell, Settings, LogOut, User } from "lucide-react";
import Avatar from "../shared/Avatar";
import { clearAuthSession } from "@/lib/auth";

export default function CandidateTopbar({ onLogout }) {
  return (
    <header className="fixed right-0 top-0 left-80 border-b border-orange-100 bg-white px-6 py-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Candidate Dashboard
          </h2>
          <p className="text-xs text-gray-500">Welcome back</p>
        </div>

        <div className="flex items-center gap-4">
          <button className="relative rounded-full bg-orange-50 p-2 text-orange-600 hover:bg-orange-100">
            <Bell size={20} />
            <span className="absolute right-0 top-0 h-2 w-2 rounded-full bg-red-500" />
          </button>

          <button className="rounded-full bg-orange-50 p-2 text-orange-600 hover:bg-orange-100">
            <Settings size={20} />
          </button>

          <div className="h-8 w-px bg-orange-100" />

          <div className="flex items-center gap-3">
            <div>
              <p className="text-sm font-medium text-gray-900">Candidate</p>
              <p className="text-xs text-gray-500">you@hireiq.com</p>
            </div>
            <Avatar name="Candidate" size="md" />
          </div>

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
