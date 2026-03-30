import { createFileRoute } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { loginApi, registerApi } from "@/apis/auth";
import { saveAuthSession } from "@/lib/auth";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  const loginMutation = useMutation({
    mutationFn: loginApi,
    onSuccess: (payload) => {
      const data = payload?.data || {};
      saveAuthSession({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        user: data.user,
      });
      window.location.assign("/");
    },
  });

  const registerMutation = useMutation({
    mutationFn: registerApi,
    onSuccess: () => {
      setMode("login");
    },
  });

  const currentError =
    loginMutation.error?.message || registerMutation.error?.message || "";

  const isSubmitting = loginMutation.isPending || registerMutation.isPending;

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!form.email.trim() || !form.password.trim()) return;

    if (mode === "register") {
      registerMutation.mutate({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
      });
      return;
    }

    loginMutation.mutate({
      email: form.email.trim(),
      password: form.password,
    });
  };

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <section className="w-full max-w-md rounded-3xl border border-(--border) bg-(--card)/80 p-6 shadow-xl backdrop-blur md:p-8">
        <p className="m-0 text-xs font-semibold uppercase tracking-[0.2em] text-(--muted-foreground)">
          Hiring Platform
        </p>
        <h1 className="mb-2 mt-2 text-2xl font-semibold text-(--card-foreground)">
          {mode === "login" ? "Sign in" : "Create account"}
        </h1>
        <p className="mb-6 mt-0 text-sm text-(--muted-foreground)">
          {mode === "login"
            ? "Enter your credentials to access the dashboard."
            : "Register a new account, then sign in with your email and password."}
        </p>

        <form className="space-y-3" onSubmit={handleSubmit}>
          {mode === "register" && (
            <input
              value={form.name}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, name: e.target.value }))
              }
              className="w-full rounded-xl border border-(--border) bg-white/60 px-3 py-2 text-sm outline-none ring-(--primary) transition focus:ring-2"
              placeholder="Full name"
              required
            />
          )}

          <input
            type="email"
            value={form.email}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, email: e.target.value }))
            }
            className="w-full rounded-xl border border-(--border) bg-white/60 px-3 py-2 text-sm outline-none ring-(--primary) transition focus:ring-2"
            placeholder="Email"
            required
          />
          <input
            type="password"
            value={form.password}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, password: e.target.value }))
            }
            className="w-full rounded-xl border border-(--border) bg-white/60 px-3 py-2 text-sm outline-none ring-(--primary) transition focus:ring-2"
            placeholder="Password"
            required
          />

          {currentError && (
            <p className="m-0 text-sm text-red-600">{currentError}</p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-xl border border-transparent bg-(--primary) px-4 py-2 text-sm font-semibold text-(--primary-foreground)"
          >
            {isSubmitting
              ? "Please wait..."
              : mode === "login"
                ? "Sign in"
                : "Create account"}
          </button>
        </form>

        <button
          type="button"
          className="mt-4 w-full rounded-xl border border-(--border) px-4 py-2 text-sm font-medium text-(--muted-foreground)"
          onClick={() => {
            setMode((prev) => (prev === "login" ? "register" : "login"));
          }}
        >
          {mode === "login"
            ? "Don't have an account? Register"
            : "Already have an account? Sign in"}
        </button>
      </section>
    </main>
  );
}
