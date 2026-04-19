import { useEffect, useMemo, useState } from "react";
import { Modal } from "@/components/companies/Modal";
import { Button } from "@/components/companies/Button";

function toDateTimeInput(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function toPayload(form) {
  const min = form.salary_min === "" ? null : Number(form.salary_min);
  const max = form.salary_max === "" ? null : Number(form.salary_max);

  const payload = {
    company_id: Number(form.company_id),
    title: form.title.trim(),
    description: form.description.trim() || undefined,
    location: form.location.trim() || undefined,
    currency: form.currency.trim() || "USD",
    required_experience:
      form.required_experience === ""
        ? undefined
        : Number(form.required_experience),
    experience_level: form.experience_level || undefined,
    project_duration_days:
      form.project_duration_days === ""
        ? undefined
        : Number(form.project_duration_days),
    is_remote: form.is_remote,
    status: form.status || "open",
    deadline: form.deadline ? new Date(form.deadline).toISOString() : undefined,
  };

  if (min !== null && max !== null) {
    payload.salary_range = [min, max];
  }

  Object.keys(payload).forEach((key) => {
    if (payload[key] === undefined || payload[key] === "") {
      delete payload[key];
    }
  });

  return payload;
}

function getInitialState(job, companyId) {
  return {
    company_id: String(job?.company_id || companyId || ""),
    title: job?.title || "",
    description: job?.description || "",
    location: job?.location || "",
    salary_min: Array.isArray(job?.salary_range)
      ? String(job.salary_range[0])
      : "",
    salary_max: Array.isArray(job?.salary_range)
      ? String(job.salary_range[1])
      : "",
    currency: job?.currency || "USD",
    required_experience:
      job?.required_experience !== undefined &&
      job?.required_experience !== null
        ? String(job.required_experience)
        : "",
    experience_level: job?.experience_level || "mid",
    project_duration_days:
      job?.project_duration_days !== undefined &&
      job?.project_duration_days !== null
        ? String(job.project_duration_days)
        : "",
    is_remote: Boolean(job?.is_remote),
    status: job?.status || "open",
    deadline: toDateTimeInput(job?.deadline),
  };
}

export function JobModal({
  open,
  mode,
  job,
  companyOptions,
  isSaving,
  onClose,
  onSave,
}) {
  const [form, setForm] = useState(
    getInitialState(null, companyOptions[0]?.id),
  );

  const hasCompanies = companyOptions.length > 0;

  useEffect(() => {
    if (!open) return;
    setForm(getInitialState(job, companyOptions[0]?.id));
  }, [open, job, companyOptions]);

  const modalTitle = mode === "edit" ? "Edit Job" : "Post New Job";
  const submitLabel = mode === "edit" ? "Save Changes" : "Create Job";

  const disableSubmit = useMemo(() => {
    return !form.company_id || !form.title.trim() || !hasCompanies;
  }, [form.company_id, form.title, hasCompanies]);

  return (
    <Modal
      open={open}
      title={modalTitle}
      onClose={onClose}
      widthClassName="max-w-3xl"
      actions={
        <>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={() => onSave(toPayload(form))}
            disabled={isSaving || disableSubmit}
          >
            {isSaving ? "Saving..." : submitLabel}
          </Button>
        </>
      }
    >
      {!hasCompanies ? (
        <p className="m-0 rounded-xl border border-[#fed7aa] bg-[#fff7ed] px-4 py-3 text-sm text-[#9a3412]">
          No companies available. Create a company first to post jobs.
        </p>
      ) : null}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm text-(--dash-muted)">
          Company
          <select
            value={form.company_id}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, company_id: event.target.value }))
            }
            className="h-10 rounded-xl border border-(--dash-border) bg-(--dash-surface) px-3 text-(--dash-text) outline-none"
          >
            <option value="">Select a company</option>
            {companyOptions.map((company) => (
              <option key={company.id} value={company.id}>
                {company.name}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-2 text-sm text-(--dash-muted)">
          Title
          <input
            value={form.title}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, title: event.target.value }))
            }
            className="h-10 rounded-xl border border-(--dash-border) bg-(--dash-surface) px-3 text-(--dash-text) outline-none"
            placeholder="e.g. Senior Frontend Developer"
          />
        </label>

        <label className="flex flex-col gap-2 text-sm text-(--dash-muted) md:col-span-2">
          Description
          <textarea
            value={form.description}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, description: event.target.value }))
            }
            className="min-h-24 rounded-xl border border-(--dash-border) bg-(--dash-surface) px-3 py-2 text-(--dash-text) outline-none"
            placeholder="Describe responsibilities and expectations"
          />
        </label>

        <label className="flex flex-col gap-2 text-sm text-(--dash-muted)">
          Location
          <input
            value={form.location}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, location: event.target.value }))
            }
            className="h-10 rounded-xl border border-(--dash-border) bg-(--dash-surface) px-3 text-(--dash-text) outline-none"
            placeholder="City, Country"
          />
        </label>

        <label className="flex flex-col gap-2 text-sm text-(--dash-muted)">
          Currency
          <select
            value={form.currency}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, currency: event.target.value }))
            }
            className="h-10 rounded-xl border border-(--dash-border) bg-(--dash-surface) px-3 text-(--dash-text) outline-none"
          >
            <option value="USD">USD</option>
            <option value="NPR">NPR</option>
            <option value="INR">INR</option>
          </select>
        </label>

        <label className="flex flex-col gap-2 text-sm text-(--dash-muted)">
          Salary Min
          <input
            type="number"
            min="0"
            value={form.salary_min}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, salary_min: event.target.value }))
            }
            className="h-10 rounded-xl border border-(--dash-border) bg-(--dash-surface) px-3 text-(--dash-text) outline-none"
            placeholder="50000"
          />
        </label>

        <label className="flex flex-col gap-2 text-sm text-(--dash-muted)">
          Salary Max
          <input
            type="number"
            min="0"
            value={form.salary_max}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, salary_max: event.target.value }))
            }
            className="h-10 rounded-xl border border-(--dash-border) bg-(--dash-surface) px-3 text-(--dash-text) outline-none"
            placeholder="90000"
          />
        </label>

        <label className="flex flex-col gap-2 text-sm text-(--dash-muted)">
          Experience Level
          <select
            value={form.experience_level}
            onChange={(event) =>
              setForm((prev) => ({
                ...prev,
                experience_level: event.target.value,
              }))
            }
            className="h-10 rounded-xl border border-(--dash-border) bg-(--dash-surface) px-3 text-(--dash-text) outline-none"
          >
            <option value="junior">Junior</option>
            <option value="mid">Mid</option>
            <option value="senior">Senior</option>
          </select>
        </label>

        <label className="flex flex-col gap-2 text-sm text-(--dash-muted)">
          Status
          <select
            value={form.status}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, status: event.target.value }))
            }
            className="h-10 rounded-xl border border-(--dash-border) bg-(--dash-surface) px-3 text-(--dash-text) outline-none"
          >
            <option value="open">Open</option>
            <option value="closed">Closed</option>
          </select>
        </label>

        <label className="flex flex-col gap-2 text-sm text-(--dash-muted)">
          Required Experience (years)
          <input
            type="number"
            min="0"
            value={form.required_experience}
            onChange={(event) =>
              setForm((prev) => ({
                ...prev,
                required_experience: event.target.value,
              }))
            }
            className="h-10 rounded-xl border border-(--dash-border) bg-(--dash-surface) px-3 text-(--dash-text) outline-none"
            placeholder="2"
          />
        </label>

        <label className="flex flex-col gap-2 text-sm text-(--dash-muted)">
          Project Duration (days)
          <input
            type="number"
            min="1"
            value={form.project_duration_days}
            onChange={(event) =>
              setForm((prev) => ({
                ...prev,
                project_duration_days: event.target.value,
              }))
            }
            className="h-10 rounded-xl border border-(--dash-border) bg-(--dash-surface) px-3 text-(--dash-text) outline-none"
            placeholder="90"
          />
        </label>

        <label className="flex flex-col gap-2 text-sm text-(--dash-muted)">
          Deadline
          <input
            type="datetime-local"
            value={form.deadline}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, deadline: event.target.value }))
            }
            className="h-10 rounded-xl border border-(--dash-border) bg-(--dash-surface) px-3 text-(--dash-text) outline-none"
          />
        </label>

        <label className="flex items-center gap-2 pt-8 text-sm text-(--dash-muted)">
          <input
            type="checkbox"
            checked={form.is_remote}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, is_remote: event.target.checked }))
            }
            className="h-4 w-4 accent-(--dash-accent)"
          />
          Remote role
        </label>
      </div>
    </Modal>
  );
}
