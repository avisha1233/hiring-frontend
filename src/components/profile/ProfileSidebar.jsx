import Avatar from "@/components/shared/Avatar";
import { MapPin, Phone, GraduationCap, Briefcase, Clock } from "lucide-react";

export default function ProfileSidebar({ watch, workCount, eduCount, certCount }) {
  const values = watch();

  return (
    <aside className="rounded-xl border border-orange-100 bg-white p-4 shadow-sm space-y-4">

      <div className="flex flex-col items-center gap-2 pb-4 border-b border-orange-50">
        <Avatar name={values.full_name || values.email || "C"} size="xl" />
        <p className="font-semibold text-gray-900">{values.full_name || "Your Name"}</p>
        <p className="text-sm text-gray-500">{values.email || ""}</p>
        {values.is_open_to_work ? (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
            Open to work
          </span>
        ) : (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
            <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
            Not available
          </span>
        )}
      </div>

      <div className="space-y-2 text-sm text-gray-600">
        {[
          { icon: MapPin,        value: values.location },
          { icon: Phone,         value: values.phone },
          { icon: GraduationCap, value: values.qualification },
          { icon: Briefcase,     value: values.experience ? `${values.experience} yrs experience` : "" },
          { icon: Clock,         value: values.notice_period_days ? `${values.notice_period_days} day notice` : "" },
        ].map(({ icon: Icon, value }) =>
          value ? (
            <div key={value} className="flex items-center gap-2">
              <Icon size={14} className="text-gray-400 shrink-0" />
              <span className="truncate">{value}</span>
            </div>
          ) : null
        )}
      </div>

      {(values.linkedin_url || values.github_url || values.portfolio_url) && (
        <div className="border-t border-orange-50 pt-3 space-y-1.5">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Links</p>
          {values.linkedin_url && (
            <a href={values.linkedin_url} target="_blank" rel="noreferrer"
              className="block text-xs text-blue-600 hover:underline truncate">
              {values.linkedin_url}
            </a>
          )}
          {values.github_url && (
            <a href={values.github_url} target="_blank" rel="noreferrer"
              className="block text-xs text-gray-700 hover:underline truncate">
              {values.github_url}
            </a>
          )}
          {values.portfolio_url && (
            <a href={values.portfolio_url} target="_blank" rel="noreferrer"
              className="block text-xs text-orange-500 hover:underline truncate">
              {values.portfolio_url}
            </a>
          )}
        </div>
      )}

      <div className="border-t border-orange-50 pt-3 space-y-1.5 text-sm text-gray-600">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Summary</p>
        <div className="flex justify-between">
          <span>Jobs</span>
          <span className="font-medium text-gray-800">{workCount}</span>
        </div>
        <div className="flex justify-between">
          <span>Education</span>
          <span className="font-medium text-gray-800">{eduCount}</span>
        </div>
        <div className="flex justify-between">
          <span>Certifications</span>
          <span className="font-medium text-gray-800">{certCount}</span>
        </div>
      </div>

    </aside>
  );
}