import { Outlet } from "react-router-dom";
import CandidateSidebar from "./CandidateSidebar";
import CandidateTopbar from "./CandidateTopbar";
import { clearAuthSession } from "@/lib/auth";

export default function CandidateLayout() {
  const handleLogout = () => {
    clearAuthSession();
    localStorage.removeItem("accessToken");
    window.location.href = "/login";
  };

  return (
    <div className="min-h-screen bg-white-10">
      <CandidateSidebar />
      <CandidateTopbar onLogout={handleLogout} />

      <main className="ml-80 mt-20 p-6">
        <div className="mx-auto max-w-7xl">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
