import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import LoadingSkeleton from "@/components/shared/LoadingSkeleton";
import ProfileSidebar from "@/components/profile/ProfileSidebar";
import PersonalInfoSection from "@/components/profile/PersonalInfoSection";
import WorkExperienceSection from "@/components/profile/WorkExperienceSection";
import EducationSection from "@/components/profile/EducationSection";
import SkillsSection from "@/components/profile/SkillsSection";
import { useCandidateProfile } from "@/hooks/useCandidateProfile";

export default function Profile() {
  const {
    loading,
    saving,
    profile,
    workItems,
    eduItems,
    setWorkItems,
    setEduItems,
    saveProfile,
  } = useCandidateProfile();

  const [resumeFile, setResumeFile] = useState(null);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { isDirty },
  } = useForm();

  useEffect(() => {
    if (profile) reset(profile);
  }, [profile, reset]);

  if (loading) return <LoadingSkeleton rows={6} columns={6} />;

  return (
    <form
      onSubmit={handleSubmit((data) => saveProfile(data, resumeFile))}
      className="space-y-4"
    >
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
          <p className="text-sm text-gray-500">Manage your profile</p>
        </div>
<div className="flex items-center gap-3">
  {isDirty && (
    <span className="text-sm text-orange-600">Unsaved changes</span>
  )}
  <button
    type="submit"
    disabled={saving}
    className="rounded-lg bg-orange-600 px-5 py-2 text-sm font-semibold text-white hover:bg-orange-700 disabled:opacity-60"
  >
    {saving ? "Saving..." : "Save changes"}
  </button>
</div>
</div>
        
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[300px,1fr]">
          <ProfileSidebar
            watch={watch}
            workCount={workItems.length}
            eduCount={eduItems.length}
          />
          <div className="space-y-4">
            <PersonalInfoSection
              register={register}
              resumeUrl={profile?.resume_url}
              onResumeChange={setResumeFile}
            />
            <WorkExperienceSection items={workItems} onUpdate={setWorkItems} />
            <EducationSection items={eduItems} onUpdate={setEduItems} />
            <SkillsSection />
          </div>
        </div>
      
    </form>
  );
}
