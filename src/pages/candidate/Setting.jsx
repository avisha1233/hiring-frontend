// src/pages/candidate/Setting.jsx

import { useState } from "react";
import { Lock, Eye, EyeOff, Save } from "lucide-react";
import { api } from "../../services/api";

function PasswordField({ label, value, onChange, placeholder }) {
  const [show, setShow] = useState(false);
  return (
    <div className="flex flex-col gap-1 mb-3">
      <label className="text-xs text-gray-500">{label}</label>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full text-sm px-3 py-2 pr-9 rounded-lg border border-orange-200 focus:outline-none focus:ring-2 focus:ring-orange-300 bg-white text-gray-900"
        />
        <button
          type="button"
          onClick={() => setShow(!show)}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          {show ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
      </div>
    </div>
  );
}

function getStrength(pw) {
  if (!pw) return null;
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  const levels = [
    { label: "Weak",   color: "#E24B4A", pct: 25  },
    { label: "Fair",   color: "#EF9F27", pct: 50  },
    { label: "Good",   color: "#F97316", pct: 75  },
    { label: "Strong", color: "#1D9E75", pct: 100 },
  ];
  return levels[score - 1] || levels[0];
}

export default function Settings() {
  const stored =
    JSON.parse(localStorage.getItem("authUser") || "null") ||
    JSON.parse(localStorage.getItem("user") || "{}");
  const userId = stored?.id;

  const [pw, setPw] = useState({ current: "", next: "", confirm: "" });
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const strength = getStrength(pw.next);

  async function changePassword() {
    setError(null);

    if (!pw.current || !pw.next || !pw.confirm) {
      setError("Please fill in all three fields.");
      return;
    }
    if (pw.next !== pw.confirm) {
      setError("New passwords do not match.");
      return;
    }
    if (pw.next.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }

    setSaving(true);
    try {
      await api.patch(`/users/${userId}`, {
        current_password: pw.current,
        password: pw.next,
      });
      setPw({ current: "", next: "", confirm: "" });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          "Could not update password. Check your current password."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="w-full max-w-md">
        
        <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500">Manage your account</p>
      </div>

      <div className="bg-white border border-orange-100 rounded-xl p-5 shadow-sm">
        <div className="flex items-center gap-2 text-sm font-medium mb-4 pb-3 border-b border-orange-50">
        
          <Lock size={15} className="text-orange-500" />
          Change password
        </div>

        {error && (
          <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            {error}
          </div>
        )}

        <PasswordField
          label="Current password"
          value={pw.current}
          onChange={(v) => setPw({ ...pw, current: v })}
          placeholder="Enter your current password"
        />

        <div className="grid grid-cols-2 gap-3">
          <PasswordField
            label="New password"
            value={pw.next}
            onChange={(v) => setPw({ ...pw, next: v })}
            placeholder="Min. 8 characters"
          />
          <PasswordField
            label="Confirm new password"
            value={pw.confirm}
            onChange={(v) => setPw({ ...pw, confirm: v })}
            placeholder="Repeat new password"
          />
        </div>

        {pw.next && strength && (
          <div className="mb-3">
            <p className="mb-1 text-xs text-gray-400">Password strength</p>
            <div className="h-1.5 w-full rounded-full bg-orange-100 overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${strength.pct}%`, background: strength.color }}
              />
            </div>
            <p className="mt-1 text-xs" style={{ color: strength.color }}>
              {strength.label}
            </p>
          </div>
        )}

        <button
          onClick={changePassword}
          disabled={saving}
          className="inline-flex items-center gap-2 text-sm px-4 py-2 rounded-lg text-white transition-colors"
          style={{
            background: saved ? "#1D9E75" : saving ? "#FFD0B0" : "#F97316",
            cursor: saving ? "not-allowed" : "pointer",
          }}
        >
          <Save size={14} />
          {saved ? "Password updated!" : saving ? "Saving…" : "Update password"}
        </button>
      </div>
    </div>
    </div>
  );
}
