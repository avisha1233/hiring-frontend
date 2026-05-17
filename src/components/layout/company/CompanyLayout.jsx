import { Outlet } from "react-router-dom";
import CompanySidebar from "./CompanySidebar";
import CompanyTopbar from "./CompanyTopbar";
import { clearAuthSession } from "@/lib/auth";

export default function CompanyLayout() {
  const handleLogout = () => {
    clearAuthSession();
    localStorage.removeItem("accessToken");
    window.location.href = "/login";
  };

  return (
    <div className="min-h-screen bg-orange-50">
      <CompanySidebar />
      <CompanyTopbar onLogout={handleLogout} />

      <main className="ml-80 mt-20 p-6">
        <div className="mx-auto max-w-7xl">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
