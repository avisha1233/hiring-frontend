import { useState } from "react";
import { Button } from "@/components/companies/Button";
import { Modal } from "@/components/companies/Modal";

const INITIAL_FORM = {
  name: "",
  industry: "",
  location: "",
  size: "",
  status: "active",
  website_url: "",
  logo_url: "",
};

function toFormValue(company) {
  if (!company) {
    return INITIAL_FORM;
  }

  return {
    name: company.name || "",
    industry: company.industry || "",
    location: company.location || "",
    size: company.size || company.employee_range || "",
    status: company.status || "active",
    website_url: company.website_url || "",
    logo_url: company.logo_url || "",
  };
}

export function CompanyModal({
  open,
  mode,
  company,
  onClose,
  onSubmit,
  loading,
}) {
  const [form, setForm] = useState(() => toFormValue(company));

  const title = mode === "edit" ? "Edit Company" : "Add Company";

  return (
    <Modal
      open={open}
      title={title}
      onClose={onClose}
      actions={
        <>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            type="submit"
            form="company-form"
            disabled={loading || !form.name.trim()}
          >
            {loading
              ? "Saving..."
              : mode === "edit"
                ? "Save Changes"
                : "Create Company"}
          </Button>
        </>
      }
    >
      <form
        id="company-form"
        className="grid grid-cols-1 gap-3 md:grid-cols-2"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit(form);
        }}
      >
        <label className="space-y-1 text-sm text-[var(--dash-muted)]">
          <span>Name</span>
          <input
            className="h-10 w-full rounded-xl border border-[var(--dash-border)] bg-[var(--dash-surface)] px-3 text-sm text-[var(--dash-text)] outline-none focus:border-[var(--dash-accent)]"
            value={form.name}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, name: event.target.value }))
            }
            placeholder="TechCorp Inc"
            required
          />
        </label>

        <label className="space-y-1 text-sm text-[var(--dash-muted)]">
          <span>Industry</span>
          <input
            className="h-10 w-full rounded-xl border border-[var(--dash-border)] bg-[var(--dash-surface)] px-3 text-sm text-[var(--dash-text)] outline-none focus:border-[var(--dash-accent)]"
            value={form.industry}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, industry: event.target.value }))
            }
            placeholder="Technology"
          />
        </label>

        <label className="space-y-1 text-sm text-[var(--dash-muted)]">
          <span>Location</span>
          <input
            className="h-10 w-full rounded-xl border border-[var(--dash-border)] bg-[var(--dash-surface)] px-3 text-sm text-[var(--dash-text)] outline-none focus:border-[var(--dash-accent)]"
            value={form.location}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, location: event.target.value }))
            }
            placeholder="San Francisco, CA"
          />
        </label>

        <label className="space-y-1 text-sm text-[var(--dash-muted)]">
          <span>Size</span>
          <input
            className="h-10 w-full rounded-xl border border-[var(--dash-border)] bg-[var(--dash-surface)] px-3 text-sm text-[var(--dash-text)] outline-none focus:border-[var(--dash-accent)]"
            value={form.size}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, size: event.target.value }))
            }
            placeholder="100-500 employees"
          />
        </label>

        <label className="space-y-1 text-sm text-[var(--dash-muted)]">
          <span>Status</span>
          <select
            className="h-10 w-full rounded-xl border border-[var(--dash-border)] bg-[var(--dash-surface)] px-3 text-sm text-[var(--dash-text)] outline-none focus:border-[var(--dash-accent)]"
            value={form.status}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, status: event.target.value }))
            }
          >
            <option value="active">Active</option>
            <option value="pending">Pending</option>
            <option value="inactive">Inactive</option>
          </select>
        </label>

        <label className="space-y-1 text-sm text-[var(--dash-muted)]">
          <span>Website URL</span>
          <input
            className="h-10 w-full rounded-xl border border-[var(--dash-border)] bg-[var(--dash-surface)] px-3 text-sm text-[var(--dash-text)] outline-none focus:border-[var(--dash-accent)]"
            value={form.website_url}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, website_url: event.target.value }))
            }
            placeholder="https://example.com"
          />
        </label>

        <label className="space-y-1 text-sm text-[var(--dash-muted)] md:col-span-2">
          <span>Logo URL</span>
          <input
            className="h-10 w-full rounded-xl border border-[var(--dash-border)] bg-[var(--dash-surface)] px-3 text-sm text-[var(--dash-text)] outline-none focus:border-[var(--dash-accent)]"
            value={form.logo_url}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, logo_url: event.target.value }))
            }
            placeholder="https://example.com/logo.png"
          />
        </label>
      </form>
    </Modal>
  );
}
