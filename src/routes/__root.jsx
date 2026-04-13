import { Outlet, createRootRoute, redirect } from "@tanstack/react-router";
import { getAccessToken } from "@/lib/auth";

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
  return <Outlet />;
}

