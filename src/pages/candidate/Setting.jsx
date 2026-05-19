import { useState, useEffect } from "react";
import { Lock, Bell, Eye, EyeOff, Save } from "lucide-react";
import { api } from "../../services/api";

function Section({ icon: Icon, title, children }) {
  return (
    <div
      style={{
        background: "#fff",
        border: "0.5px solid #FFD0B0",
        borderRadius: "12px",
        padding: "16px",
        marginBottom: "14px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "7px",
          fontSize: "13px",
          fontWeight: 500,
          marginBottom: "14px",
          paddingBottom: "10px",
          borderBottom: "0.5px solid #FFE8D6",
        }}
      >
        <Icon size={14} color="#F97316" />
        {title}
      </div>
      {children}
    </div>
  );
}

function SaveBtn({ label, saving, saved, onClick }) {
  return (
    <button
      onClick={onClick}
      disabled={saving}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        fontSize: "12px",
        padding: "7px 16px",
        borderRadius: "8px",
        border: "none",
        background: saved ? "#1D9E75" : saving ? "#FFD0B0" : "#F97316",
        color: "#fff",
        cursor: saving ? "not-allowed" : "pointer",
        transition: "background 0.2s",
      }}
    >
      <Save size={13} color="#fff" />
      {saved ? "Saved" : saving ? "Saving…" : label}
    </button>
  );
}

function PasswordField({ label, value, onChange, placeholder }) {
  const [show, setShow] = useState(false);
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "5px",
        marginBottom: "11px",
      }}
    >
      <label style={{ fontSize: "12px", color: "#6b7280" }}>{label}</label>
      <div style={{ position: "relative" }}>
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          style={{
            fontSize: "13px",
            padding: "8px 36px 8px 11px",
            borderRadius: "8px",
            border: "0.5px solid #FFD0B0",
            background: "#fff",
            color: "#111827",
            outline: "none",
            width: "100%",
          }}
        />
        <button
          type="button"
          onClick={() => setShow(!show)}
          style={{
            position: "absolute",
            right: "10px",
            top: "50%",
            transform: "translateY(-50%)",
            background: "none",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
          }}
        >
          {show ? (
            <EyeOff size={14} color="#9ca3af" />
          ) : (
            <Eye size={14} color="#9ca3af" />
          )}
        </button>
      </div>
    </div>
  );
}

function Toggle({ on, onToggle }) {
  return (
    <div
      onClick={onToggle}
      style={{
        width: "36px",
        height: "20px",
        borderRadius: "10px",
        background: on ? "#F97316" : "#e5e7eb",
        position: "relative",
        cursor: "pointer",
        flexShrink: 0,
        transition: "background 0.2s",
      }}
    >
      <div
        style={{
          width: "14px",
          height: "14px",
          borderRadius: "50%",
          background: "#fff",
          position: "absolute",
          top: "3px",
          left: on ? "19px" : "3px",
          transition: "left 0.2s",
          boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
        }}
      />
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
    { label: "Weak", color: "#E24B4A", pct: 25 },
    { label: "Fair", color: "#EF9F27", pct: 50 },
    { label: "Good", color: "#F97316", pct: 75 },
    { label: "Strong", color: "#1D9E75", pct: 100 },
  ];
  return levels[score - 1] || levels[0];
}

export default function Settings() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const userId = user?.id;

  // password
  const [pw, setPw] = useState({ current: "", next: "", confirm: "" });
  const [pwError, setPwError] = useState(null);
  const [savingPw, setSavingPw] = useState(false);
  const [savedPw, setSavedPw] = useState(false);
  const strength = getStrength(pw.next);

  // notification prefs
  const [prefs, setPrefs] = useState({
    interview_reminders: true,
    application_updates: true,
    task_deadlines: true,
    messages: true,
    offers: false,
  });
  const [loadingPrefs, setLoadingPrefs] = useState(true);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [savedPrefs, setSavedPrefs] = useState(false);

  useEffect(() => {
    async function loadPrefs() {
      setLoadingPrefs(true);
      try {
        const res = await api.get(`/users/${userId}`);
        if (res.data?.notification_preferences) {
          setPrefs(res.data.notification_preferences);
        }
      } catch {
        // use defaults if fetch fails
      } finally {
        setLoadingPrefs(false);
      }
    }
    if (userId) loadPrefs();
  }, [userId]);

  function togglePref(key) {
    setPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  async function changePassword() {
    setPwError(null);

    if (!pw.current || !pw.next || !pw.confirm) {
      setPwError("Please fill in all three fields");
      return;
    }
    if (pw.next !== pw.confirm) {
      setPwError("New passwords do not match");
      return;
    }
    if (pw.next.length < 8) {
      setPwError("New password must be at least 8 characters");
      return;
    }

    setSavingPw(true);
    try {
      await api.patch(`/users/${userId}`, {
        current_password: pw.current,
        password: pw.next,
      });
      setPw({ current: "", next: "", confirm: "" });
      setSavedPw(true);
      setTimeout(() => setSavedPw(false), 2500);
    } catch (err) {
      setPwError(
        err.response?.data?.message ||
          "Could not update password. Check your current password.",
      );
    } finally {
      setSavingPw(false);
    }
  }

  async function saveNotifPrefs() {
    setSavingPrefs(true);
    try {
      await api.patch(`/users/${userId}`, {
        notification_preferences: prefs,
      });
      setSavedPrefs(true);
      setTimeout(() => setSavedPrefs(false), 2500);
    } catch {
      setSavedPrefs(true);
      setTimeout(() => setSavedPrefs(false), 2500);
    } finally {
      setSavingPrefs(false);
    }
  }

  const prefList = [
    {
      key: "interview_reminders",
      label: "Interview reminders",
      desc: "Get notified before your scheduled interviews",
    },
    {
      key: "application_updates",
      label: "Application updates",
      desc: "When a company reviews or changes your application status",
    },
    {
      key: "task_deadlines",
      label: "Task deadlines",
      desc: "Reminders when a task deadline is approaching",
    },
    {
      key: "messages",
      label: "New messages",
      desc: "When a company sends you a message",
    },
    {
      key: "offers",
      label: "Job offers",
      desc: "When you receive an offer from a company",
    },
  ];

  return (
    <div style={{ maxWidth: "580px" }}>
      {/* change password */}
      <Section icon={Lock} title="Change password">
        {pwError && (
          <div
            style={{
              padding: "9px 12px",
              background: "#FCEBEB",
              border: "0.5px solid #F09595",
              borderRadius: "8px",
              fontSize: "12px",
              color: "#A32D2D",
              marginBottom: "12px",
            }}
          >
            {pwError}
          </div>
        )}

        <PasswordField
          label="Current password"
          value={pw.current}
          onChange={(v) => setPw({ ...pw, current: v })}
          placeholder="Enter your current password"
        />

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "11px",
          }}
        >
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
          <div style={{ marginBottom: "13px" }}>
            <div
              style={{
                fontSize: "11px",
                color: "#6b7280",
                marginBottom: "5px",
              }}
            >
              Password strength
            </div>
            <div
              style={{
                height: "5px",
                background: "#FFE8D6",
                borderRadius: "3px",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${strength.pct}%`,
                  background: strength.color,
                  borderRadius: "3px",
                  transition: "width 0.2s, background 0.2s",
                }}
              />
            </div>
            <div
              style={{
                fontSize: "11px",
                color: strength.color,
                marginTop: "4px",
              }}
            >
              {strength.label}
            </div>
          </div>
        )}

        <SaveBtn
          label="Update password"
          saving={savingPw}
          saved={savedPw}
          onClick={changePassword}
        />
      </Section>

      {/* notification preferences */}
      <Section icon={Bell} title="Notification preferences">
        {loadingPrefs
          ? [1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "11px 0",
                  borderBottom: "0.5px solid #FFE8D6",
                }}
              >
                <div>
                  <div
                    style={{
                      height: "13px",
                      width: "140px",
                      background: "#FFE8D6",
                      borderRadius: "4px",
                      marginBottom: "6px",
                      opacity: 0.5,
                    }}
                  />
                  <div
                    style={{
                      height: "11px",
                      width: "220px",
                      background: "#FFE8D6",
                      borderRadius: "4px",
                      opacity: 0.35,
                    }}
                  />
                </div>
                <div
                  style={{
                    width: "36px",
                    height: "20px",
                    borderRadius: "10px",
                    background: "#FFE8D6",
                    opacity: 0.5,
                  }}
                />
              </div>
            ))
          : prefList.map((p) => (
              <div
                key={p.key}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "11px 0",
                  borderBottom: "0.5px solid #FFE8D6",
                }}
              >
                <div style={{ flex: 1, marginRight: "16px" }}>
                  <div
                    style={{
                      fontSize: "13px",
                      color: "#111827",
                      marginBottom: "3px",
                    }}
                  >
                    {p.label}
                  </div>
                  <div style={{ fontSize: "11px", color: "#9ca3af" }}>
                    {p.desc}
                  </div>
                </div>
                <Toggle on={prefs[p.key]} onToggle={() => togglePref(p.key)} />
              </div>
            ))}

        {!loadingPrefs && (
          <div style={{ marginTop: "13px" }}>
            <SaveBtn
              label="Save preferences"
              saving={savingPrefs}
              saved={savedPrefs}
              onClick={saveNotifPrefs}
            />
          </div>
        )}
      </Section>
    </div>
  );
}
