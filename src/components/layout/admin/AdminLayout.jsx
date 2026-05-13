import { Outlet } from "react-router-dom";
import AdminSidebar from "./AdminSidebar";
import AdminTopbar from "./AdminTopbar";
import { clearAuthSession } from "../../../lib/auth";

export default function AdminLayout() {
  const handleLogout = () => {
    clearAuthSession();
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  return (
    <div className="min-h-screen bg-orange-50">
      <AdminSidebar />
      <AdminTopbar onLogout={handleLogout} />

      <main className="ml-80 mt-20 p-6">
        <div className="mx-auto max-w-7xl">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
