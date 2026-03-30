import * as React from "react";
import {
  Outlet,
  createRootRoute,
  redirect,
  useRouterState,
} from "@tanstack/react-router";
import { clearAuthSession, getAccessToken, getAuthUser } from "@/lib/auth";

export const Route = createRootRoute({
  component: RootComponent,
  beforeLoad: ({ location }) => {
    if (typeof window === "undefined") return;

    const token = getAccessToken();
    const isLoginPath = location.pathname.startsWith("/login");

    if (!token && !isLoginPath) {
      throw redirect({ to: "/login", replace: true });
    }

    if (token && isLoginPath) {
      throw redirect({ to: "/", replace: true });
    }
  },
});

function RootComponent() {
  const location = useRouterState({ select: (s) => s.location });
  const isLogin = location.pathname.startsWith("/login");
  const user = getAuthUser();

  if (isLogin) {
    return <Outlet />;
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl px-4 py-8 md:px-8">
      <header className="mb-6 flex items-center justify-between rounded-2xl border border-(--border) bg-(--card)/70 p-4 backdrop-blur">
        <h1 className="m-0 text-xl font-semibold text-(--card-foreground) md:text-2xl">
          Hiring Dashboard
        </h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-(--muted-foreground)">
            {user?.name || user?.email || "Authenticated"}
          </span>
          <button
            type="button"
            className="rounded-lg border border-(--border) px-3 py-1.5 text-sm font-medium text-(--muted-foreground) hover:bg-black/5"
            onClick={() => {
              clearAuthSession();
              window.location.assign("/login");
            }}
          >
            Logout
          </button>
        </div>
      </header>

      <section className="rounded-3xl border border-(--border) bg-(--card)/75 p-4 shadow-sm backdrop-blur md:p-6">
        <Outlet />
      </section>
    </main>
  );
}
