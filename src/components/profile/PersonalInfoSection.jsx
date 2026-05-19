import { useEffect, useState } from "react";
import { FileText } from "lucide-react";

const inputClass =
  "h-10 w-full rounded-lg border border-orange-100 px-3 text-sm outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-100";

export default function PersonalInfoSection({
  register,
  resumeUrl,
  onResumeChange,
}) {
  const [resumeName, setResumeName] = useState(
    resumeUrl ? resumeUrl.split("/").pop() : null,
  );

  useEffect(() => {
    setResumeName(resumeUrl ? resumeUrl.split("/").pop() : null);
  }, [resumeUrl]);

  function handleResumeChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    setResumeName(file.name);
    onResumeChange(file);
  }

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
          Social & portfolio links
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
            {
              name: "portfolio_url",
              label: "Portfolio",
              placeholder: "yoursite.dev",
            },
            {
              name: "twitter_url",
              label: "Twitter / X",
              placeholder: "x.com/yourhandle",
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
        <label className="flex items-center gap-3 rounded-lg border border-dashed border-orange-200 p-3 cursor-pointer hover:border-orange-400 hover:bg-orange-50/30 transition-colors">
          <FileText size={20} className="text-orange-400 shrink-0" />
          <div>
            <p className="text-sm font-medium text-gray-700">
              {resumeName ?? "Click to upload resume"}
            </p>
            <p className="text-xs text-gray-400">PDF, DOC or DOCX · max 5 MB</p>
          </div>
          <input
            type="file"
            accept=".pdf,.doc,.docx"
            className="hidden"
            onChange={handleResumeChange}
          />
        </label>
      </div>
    </div>
  );
}
