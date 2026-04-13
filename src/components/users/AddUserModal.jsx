import { X } from "lucide-react";
import { useEffect, useState } from "react";

const INITIAL_FORM = {
  full_name: "",
  email: "",
  password: "",
  role: "candidate",
  status: "active",
};

export function AddUserModal({ open, isSaving, onClose, onSave }) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) {
      setForm(INITIAL_FORM);
      setError("");
    }
  }, [open]);

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!form.full_name.trim() || !form.email.trim() || !form.password.trim()) {
      setError("Name, email, and password are required.");
      return;
    }

    setError("");
    onSave(form);
  };

  if (!open) return null;

  return (
    <>
      <button
        type="button"
        onClick={onClose}
        className="fixed inset-0 z-40 bg-black/40"
        aria-label="Close add user modal"
      />

      <section className="fixed left-1/2 top-1/2 z-50 w-[92vw] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-(--dash-border) bg-white p-5 shadow-(--dash-shadow)">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="m-0 text-xl font-semibold text-(--dash-text)">
            Add User
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-(--dash-muted) transition hover:bg-(--dash-accent-soft) hover:text-(--dash-accent)"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <label className="block text-sm text-(--dash-muted)">
            Full Name
            <input
              type="text"
              value={form.full_name}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, full_name: event.target.value }))
              }
              className="mt-1 h-10 w-full rounded-lg border border-(--dash-border) px-3 text-(--dash-text) outline-none focus:border-(--dash-accent)"
              placeholder="Jane Cooper"
            />
          </label>

          <label className="block text-sm text-(--dash-muted)">
            Email
            <input
              type="email"
              value={form.email}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, email: event.target.value }))
              }
              className="mt-1 h-10 w-full rounded-lg border border-(--dash-border) px-3 text-(--dash-text) outline-none focus:border-(--dash-accent)"
              placeholder="jane@company.com"
            />
          </label>

          <label className="block text-sm text-(--dash-muted)">
            Password
            <input
              type="password"
              value={form.password}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, password: event.target.value }))
              }
              className="mt-1 h-10 w-full rounded-lg border border-(--dash-border) px-3 text-(--dash-text) outline-none focus:border-(--dash-accent)"
              placeholder="********"
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm text-(--dash-muted)">
              Role
              <select
                value={form.role}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, role: event.target.value }))
                }
                className="mt-1 h-10 w-full rounded-lg border border-(--dash-border) px-3 text-(--dash-text) outline-none focus:border-(--dash-accent)"
              >
                <option value="admin">Admin</option>
                <option value="hr">HR</option>
                <option value="company">Company</option>
                <option value="candidate">Candidate</option>
              </select>
            </label>

            <label className="block text-sm text-(--dash-muted)">
              Status
              <select
                value={form.status}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, status: event.target.value }))
                }
                className="mt-1 h-10 w-full rounded-lg border border-(--dash-border) px-3 text-(--dash-text) outline-none focus:border-(--dash-accent)"
              >
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="disabled">Disabled</option>
              </select>
            </label>
          </div>

          {error ? (
            <p className="m-0 text-sm text-(--dash-danger)">{error}</p>
          ) : null}

          <div className="pt-2 text-right">
            <button
              type="submit"
              disabled={isSaving}
              className="rounded-xl bg-(--dash-accent) px-4 py-2 text-sm font-semibold text-white transition hover:bg-(--dash-accent-strong) disabled:opacity-70"
            >
              {isSaving ? "Saving..." : "Create User"}
            </button>
          </div>
        </form>
      </section>
    </>
  );
}
