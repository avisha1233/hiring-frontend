import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { loginApi, registerApi } from "../apis/auth";
import { getAuthUser, saveAuthSession } from "../lib/auth";

export default function Login() {
  const navigate = useNavigate();
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [role, setRole] = useState("candidate");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const currentUser = getAuthUser();

  if (currentUser?.role === "admin") {
    return <Navigate to="/admin/dashboard" replace />;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!form.email.trim() || !form.password.trim()) {
      setError("Email and password are required.");
      return;
    }

    try {
      setLoading(true);

      if (mode === "register") {
        await registerApi({
          role,
          name: form.name.trim(),
          email: form.email.trim(),
          password: form.password,
        });
        setMode("login");
        return;
      }

      const payload = await loginApi({
        email: form.email.trim(),
        password: form.password,
      });

 

console.log(payload);

      saveAuthSession({
        accessToken: payload?.accessToken,
        refreshToken: payload?.refreshToken,
        user: payload?.user,
      });

      const role = payload?.user?.role;
      
      if (role === "admin") navigate("/admin/dashboard", { replace: true });
      else if (role === "company")
        navigate("/company/dashboard", { replace: true });
      else if (role === "candidate")
        navigate("/candidate/dashboard", { replace: true });
      else navigate("/login", { replace: true });


    } catch (err) {
      setError(err?.message || "Authentication failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-orange-50 via-white to-orange-100 px-4 py-10">
      <section className="w-full max-w-md rounded-3xl border border-orange-100 bg-white/90 p-6 shadow-xl backdrop-blur md:p-8">
        <p className="m-0 text-xs font-semibold uppercase tracking-[0.2em] text-orange-500">
          Hiring Platform
        </p>
        <h1 className="mb-2 mt-2 text-2xl font-semibold text-gray-900">
          {mode === "login" ? "Sign in" : "Create account"}
        </h1>
        <p className="mb-6 mt-0 text-sm text-gray-600">
          {mode === "login"
            ? "Enter your credentials to access the dashboard."
            : "Register as a candidate or company user. Admin accounts are managed by the system owner."}
        </p>

        <form className="space-y-3" onSubmit={handleSubmit}>
          {mode === "register" && (
            <div className="space-y-3">
              <input
                value={form.name}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, name: event.target.value }))
                }
                className="w-full rounded-xl border border-orange-200 bg-white px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-orange-300"
                placeholder="Full name"
                required
              />

              <select
                value={role}
                onChange={(event) => setRole(event.target.value)}
                className="w-full rounded-xl border border-orange-200 bg-white px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-orange-300"
              >
                <option value="candidate">Candidate</option>
                <option value="company">Company</option>
              </select>
            </div>
          )}

          <input
            type="email"
            value={form.email}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, email: event.target.value }))
            }
            className="w-full rounded-xl border border-orange-200 bg-white px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-orange-300"
            placeholder="Email"
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
            required
          />

          {error && <p className="m-0 text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading
              ? "Please wait..."
              : mode === "login"
                ? "Sign in"
                : "Create account"}
          </button>
        </form>

        <button
          type="button"
          className="mt-4 w-full rounded-xl border border-orange-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-orange-50"
          onClick={() =>
            setMode((prev) => (prev === "login" ? "register" : "login"))
          }
        >
          {mode === "login"
            ? "Don't have an account? Register"
            : "Already have an account? Sign in"}
        </button>

        <div className="mt-4 text-center text-sm text-gray-600">
          <span>Admin user?</span>{" "}
          <Link
            to="/admin/login"
            className="font-semibold text-orange-600 underline-offset-4 hover:underline"
          >
            Sign in here
          </Link>
        </div>
      </section>
    </main>
  );
}
