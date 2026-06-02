import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { loginApi } from "../apis/auth";
import { getAuthUser, saveAuthSession } from "../lib/auth";

export default function AdminLogin() {
  const navigate = useNavigate();
  const currentUser = getAuthUser();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (currentUser?.role === "admin") {
    return <Navigate to="/admin/dashboard" replace />;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!form.email.trim() || !form.password.trim()) {
      setError("Admin email and password are required.");
      return;
    }

    try {
      setLoading(true);

      const payload = await loginApi({
        email: form.email.trim(),
        password: form.password,
      });

       const data = payload?.data || payload || {};

      if (data?.user?.role !== "admin") {
        setError("This page is reserved for admin accounts.");
        setLoading(false);
        return;
      }

      saveAuthSession({
        accessToken: data?.accessToken,
        refreshToken: data?.refreshToken,
        user: data?.user,
      });

      navigate("/admin/dashboard", { replace: true });
    } catch (err) {
      setError(err?.message || "Admin authentication failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_#fff7ed_0,_#fff_36%,_#f3f4f6_100%)] px-4 py-10">
      <section className="relative w-full max-w-md overflow-hidden rounded-[2rem] border border-orange-100 bg-white/90 p-6 shadow-[0_30px_80px_rgba(249,115,22,0.18)] backdrop-blur md:p-8">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-orange-400 via-amber-400 to-orange-600" />

        <p className="m-0 text-xs font-semibold uppercase tracking-[0.24em] text-orange-500">
          Admin Access
        </p>
        <h1 className="mb-2 mt-2 text-2xl font-semibold text-gray-900">
          Sign in to the admin panel
        </h1>
        <p className="mb-6 mt-0 text-sm text-gray-600">
          Use the system administrator account to manage users, jobs, and
          platform settings.
        </p>

        <form className="space-y-3" onSubmit={handleSubmit}>
          <input
            type="email"
            value={form.email}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, email: event.target.value }))
            }
            className="w-full rounded-xl border border-orange-200 bg-white px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-orange-300"
            placeholder="Admin email"
            autoComplete="email"
            required
          />

          <input
            type="password"
            value={form.password}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, password: event.target.value }))
            }
            className="w-full rounded-xl border border-orange-200 bg-white px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-orange-300"
            placeholder="Password"
            autoComplete="current-password"
            required
          />

          {error && <p className="m-0 text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? "Please wait..." : "Sign in as admin"}
          </button>
        </form>
      </section>
    </main>
  );
}
