import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  return (
    <div className="space-y-4">
      <p className="m-0 text-sm font-medium uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
        Frontend Bootstrapped
      </p>
      <h2 className="m-0 text-2xl font-semibold text-[var(--card-foreground)] md:text-3xl">
        Welcome to the Hiring frontend
      </h2>
      <p className="m-0 max-w-2xl text-[var(--muted-foreground)]">
        This app is configured with TanStack Router (file-based routes),
        TanStack Query, and Tailwind CSS v4 as requested in your setup guide.
      </p>
    </div>
  );
}
