import { useState } from "react";
import { Link, useLocation } from "@tanstack/react-router";

const NAV_ITEMS = [
  { label: "Overview", to: "/company" },
  { label: "Job Postings", to: "/company/jobs" },
  { label: "Candidates", to: "/company/candidates" },
  { label: "Proposals", to: "/company/proposals" },
  { label: "Interviews", to: "/company/interviews" },
  { label: "Submissions", to: "/company/submissions" },
  { label: "Messages", to: "/company/messages" },
  { label: "Settings", to: "/company/settings" },
];

export function CompanyLayout({ children }) {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="min-h-screen bg-[#f8f3ef] text-slate-900">
      <div className="relative flex min-h-screen">
        <aside className="hidden w-72 shrink-0 border-r border-orange-200 bg-white p-6 lg:block">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-orange-500 text-white shadow-lg shadow-orange-200/40">
              C
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-orange-600">
                Company
              </p>
              <p className="text-lg font-semibold text-slate-900">
                Hiring Dashboard
              </p>
            </div>
          </div>

          <nav className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const isActive = location.pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`block rounded-2xl px-4 py-3 text-sm font-medium transition hover:bg-orange-50 ${
                    isActive
                      ? "bg-orange-100 text-orange-700"
                      : "text-slate-700"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        <div className="flex flex-1 flex-col">
          <header className="sticky top-0 z-20 border-b border-orange-100 bg-[#fff8f3] px-4 py-4 shadow-sm shadow-orange-50 sm:px-6 lg:hidden">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-orange-600">
                  Company Dashboard
                </p>
                <p className="text-base font-semibold text-slate-900">
                  Manage hiring workflow
                </p>
              </div>
              <button
                type="button"
                className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-500 text-white shadow-lg shadow-orange-200/40"
                onClick={() => setIsOpen(!isOpen)}
              >
                <span className="text-xl">☰</span>
              </button>
            </div>
            {isOpen ? (
              <div className="mt-4 space-y-1">
                {NAV_ITEMS.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    className="block rounded-2xl px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-orange-50"
                    onClick={() => setIsOpen(false)}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            ) : null}
          </header>

          <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
