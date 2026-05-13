import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-orange-50 px-4">
      <div className="max-w-md rounded-3xl border border-orange-100 bg-white p-8 text-center shadow-xl">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-500">
          404
        </p>
        <h1 className="mt-3 text-2xl font-semibold text-gray-900">
          Page not found
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          The route you opened does not exist in this app.
        </p>
        <Link
          to="/admin/dashboard"
          className="mt-6 inline-flex rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600"
        >
          Go to dashboard
        </Link>
      </div>
    </main>
  );
}
