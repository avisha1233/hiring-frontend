import { X } from "lucide-react";
import { useState } from "react";

const ROLES = ["admin", "company", "candidate"];
const STATUSES = ["active", "disabled"];

export function UserFormModal({ isOpen, user, onClose, onSave, isSaving }) {
  const [form, setForm] = useState(
    user || {
      full_name: "",
      email: "",
      password: "",
      role: "candidate",
      status: "active",
    },
  );

  const [errors, setErrors] = useState({});

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!form.full_name?.trim()) newErrors.full_name = "Name is required";
    if (!form.email?.trim()) newErrors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      newErrors.email = "Invalid email format";
    if (!user && !form.password)
      newErrors.password = "Password is required for new users";
    if (form.password && form.password.length < 6)
      newErrors.password = "Password must be at least 6 characters";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      onSave(form);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/60 transition-opacity"
        onClick={onClose}
      />
      <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-[#1f3048] bg-[#0d162a] p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="m-0 text-xl font-semibold text-white">
            {user ? "Edit User" : "Add New User"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[#8ca1bd] hover:bg-[#1a2e42]"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#8ca1bd] mb-2">
              Full Name
            </label>
            <input
              type="text"
              value={form.full_name}
              onChange={(e) => handleChange("full_name", e.target.value)}
              placeholder="John Doe"
              className={`w-full rounded-lg border bg-[#0a131f] px-3 py-2 text-white outline-none transition ${
                errors.full_name ? "border-[#f87171]" : "border-[#1f3048]"
              } focus:border-[#00d09c]`}
            />
            {errors.full_name && (
              <p className="mt-1 text-sm text-[#f87171]">{errors.full_name}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-[#8ca1bd] mb-2">
              Email
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => handleChange("email", e.target.value)}
              placeholder="john@example.com"
              className={`w-full rounded-lg border bg-[#0a131f] px-3 py-2 text-white outline-none transition ${
                errors.email ? "border-[#f87171]" : "border-[#1f3048]"
              } focus:border-[#00d09c]`}
            />
            {errors.email && (
              <p className="mt-1 text-sm text-[#f87171]">{errors.email}</p>
            )}
          </div>

          {!user && (
            <div>
              <label className="block text-sm font-medium text-[#8ca1bd] mb-2">
                Password
              </label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => handleChange("password", e.target.value)}
                placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
                className={`w-full rounded-lg border bg-[#0a131f] px-3 py-2 text-white outline-none transition ${
                  errors.password ? "border-[#f87171]" : "border-[#1f3048]"
                } focus:border-[#00d09c]`}
              />
              {errors.password && (
                <p className="mt-1 text-sm text-[#f87171]">{errors.password}</p>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-[#8ca1bd] mb-2">
                Role
              </label>
              <select
                value={form.role}
                onChange={(e) => handleChange("role", e.target.value)}
                className="w-full rounded-lg border border-[#1f3048] bg-[#0a131f] px-3 py-2 text-white outline-none transition focus:border-[#00d09c]"
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r.charAt(0).toUpperCase() + r.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#8ca1bd] mb-2">
                Status
              </label>
              <select
                value={form.status}
                onChange={(e) => handleChange("status", e.target.value)}
                className="w-full rounded-lg border border-[#1f3048] bg-[#0a131f] px-3 py-2 text-white outline-none transition focus:border-[#00d09c]"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-[#1f3048] px-4 py-2 text-sm font-medium text-[#8ca1bd] hover:bg-[#1a2e42] transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 rounded-lg bg-[#00d09c] px-4 py-2 text-sm font-medium text-[#062018] hover:bg-[#00e6b0] transition disabled:opacity-50"
            >
              {isSaving ? "Saving..." : "Save User"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

