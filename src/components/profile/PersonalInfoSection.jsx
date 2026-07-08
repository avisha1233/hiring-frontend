import { useEffect, useRef, useState } from "react";
import { CheckCircle2, FileText, Trash2, UploadCloud } from "lucide-react";
import { getFileUrl } from "../../services/api";

const inputClass =
  "h-10 w-full rounded-lg border border-orange-100 px-3 text-sm outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-100";

export default function PersonalInfoSection({
  register,
  resumeUrl,
  onResumeChange,
}) {
  // resumeFile  = newly selected local File object (not yet saved)
  // resumeName  = display name (from upload or existing URL)
  // resumeUrl   = persisted URL from the server
  const [resumeFile, setResumeFileState] = useState(null);
  const [resumeName, setResumeName] = useState(
    resumeUrl ? resumeUrl.split("/").pop() : null,
  );
  const fileInputRef = useRef(null);

  useEffect(() => {
    // Only update from URL when we don't have a freshly picked local file
    if (!resumeFile) {
      setResumeName(resumeUrl ? resumeUrl.split("/").pop() : null);
    }
  }, [resumeUrl, resumeFile]);

  function handleResumeChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    setResumeFileState(file);
    setResumeName(file.name);
    onResumeChange(file);
    // reset input so the same file can be re-selected after removal
    e.target.value = "";
  }

  function handleReplace() {
    fileInputRef.current?.click();
  }

  function handleRemove() {
    setResumeFileState(null);
    setResumeName(null);
    onResumeChange(null);
  }

  // Determine the URL to preview:
  // — freshly picked local file  → object URL
  // — existing server URL        → resumeUrl
  const previewHref = resumeFile
    ? URL.createObjectURL(resumeFile)
    : resumeUrl ? getFileUrl(resumeUrl) : null;

  const hasResume = !!resumeName;

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-orange-100 bg-white p-4 shadow-sm space-y-3">
        <h2 className="text-sm font-semibold text-gray-700">
          Basic information
        </h2>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <label className="flex flex-col gap-1">
            <span className="text-xs text-gray-500">Full name</span>
            <input
              {...register("full_name")}
              placeholder=" full name"
              className={inputClass}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-gray-500">Email</span>
            <input
              {...register("email")}
              type="email"
              placeholder="email"
              className={inputClass}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-gray-500">Phone</span>
            <input
              {...register("phone")}
              placeholder=""
              className={inputClass}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-gray-500">Location</span>
            <input
              {...register("location")}
              placeholder=""
              className={inputClass}
            />
          </label>
        </div>
        <label className="flex flex-col gap-1">
          <span className="text-xs text-gray-500">Bio</span>
          <textarea
            {...register("bio")}
            rows={3}
            placeholder="Tell employers about yourself..."
            className="w-full rounded-lg border border-orange-100 px-3 py-2 text-sm outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-100 resize-none"
          />
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            {...register("is_open_to_work")}
            type="checkbox"
            className="rounded border-orange-200 text-orange-600 focus:ring-orange-400"
          />
          <span className="text-sm text-gray-600">Open to work</span>
        </label>
      </div>

      <div className="rounded-xl border border-orange-100 bg-white p-4 shadow-sm space-y-3">
        <h2 className="text-sm font-semibold text-gray-700">
          Professional details
        </h2>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <label className="flex flex-col gap-1">
            <span className="text-xs text-gray-500">Qualification</span>
            <input
              {...register("qualification")}
              placeholder=""
              className={inputClass}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-gray-500">Experience (years)</span>
            <input
              {...register("experience", { valueAsNumber: true })}
              type="number"
              min={0}
              className={inputClass}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-gray-500">Notice period (days)</span>
            <input
              {...register("notice_period_days", { valueAsNumber: true })}
              type="number"
              min={0}
              className={inputClass}
            />
          </label>
        </div>
      </div>

      <div className="rounded-xl border border-orange-100 bg-white p-4 shadow-sm space-y-3">
        <h2 className="text-sm font-semibold text-gray-700">
          Social links
        </h2>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {[
            {
              name: "linkedin_url",
              label: "LinkedIn",
              placeholder: "linkedin.com/in/yourname",
            },
            {
              name: "github_url",
              label: "GitHub",
              placeholder: "github.com/yourname",
            },
          ].map(({ name, label, placeholder }) => (
            <label key={name} className="flex flex-col gap-1">
              <span className="text-xs text-gray-500">{label}</span>
              <input
                {...register(name)}
                placeholder={placeholder}
                className={inputClass}
              />
            </label>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-orange-100 bg-white p-4 shadow-sm space-y-3">
        <h2 className="text-sm font-semibold text-gray-700">Resume / CV</h2>

        {/* Hidden file input — triggered only by the upload zone or Replace button */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.doc,.docx"
          className="hidden"
          onChange={handleResumeChange}
        />

        {hasResume ? (
          /* ── Uploaded / existing file success state ── */
          <div className="flex items-center gap-3 rounded-lg border border-green-100 bg-green-50/50 px-3 py-2.5">
            <CheckCircle2 size={18} className="text-green-500 shrink-0" />
            <div className="flex-1 min-w-0">
              {previewHref ? (
                <a
                  href={previewHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-gray-800 hover:text-orange-600 hover:underline truncate block transition-colors"
                  title="Click to preview"
                >
                  {resumeName}
                </a>
              ) : (
                <p className="text-sm font-medium text-gray-800 truncate">{resumeName}</p>
              )}
              <p className="text-xs text-gray-400">Resume / CV</p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={handleReplace}
                className="flex items-center gap-1 rounded-md border border-gray-200 bg-white px-2 py-1 text-xs font-medium text-gray-600 hover:border-orange-300 hover:text-orange-600 transition-colors"
                title="Replace file"
              >
                <UploadCloud size={11} />
                Replace
              </button>
              <button
                type="button"
                onClick={handleRemove}
                className="rounded-md p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                title="Remove file"
              >
                <Trash2 size={13} />
              </button>
            </div>
          </div>
        ) : (
          /* ── Upload drop zone (shown only when no file) ── */
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex w-full items-center gap-3 rounded-lg border border-dashed border-orange-200 p-3 text-left cursor-pointer hover:border-orange-400 hover:bg-orange-50/30 transition-colors"
          >
            <FileText size={20} className="text-orange-400 shrink-0" />
            <div>
              <p className="text-sm font-medium text-gray-700">Click to upload resume</p>
              <p className="text-xs text-gray-400">PDF, DOC or DOCX · max 5 MB</p>
            </div>
          </button>
        )}
      </div>
    </div>
  );
}
