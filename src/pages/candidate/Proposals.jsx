// src/pages/candidate/Proposals.jsx

import { useState, useEffect } from "react";
import { Building2, Briefcase, Calendar, MessageSquare, CheckCircle, XCircle } from "lucide-react";
import { toast } from "react-toastify";
import EmptyState from "../../components/shared/EmptyState";
import LoadingSkeleton from "../../components/shared/LoadingSkeleton";
import Modal from "../../components/shared/Modal";
import { candidateApi } from "../../apis/candidate";

const STATUS_CONFIG = {
  pending:  { label: "Pending",  classes: "bg-yellow-100 text-yellow-800 border border-yellow-200" },
  accepted: { label: "Accepted", classes: "bg-emerald-100 text-emerald-800 border border-emerald-200" },
  rejected: { label: "Rejected", classes: "bg-rose-100 text-rose-800 border border-rose-200" },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${cfg.classes}`}>
      {cfg.label}
    </span>
  );
}

function ProposalCard({ proposal, onAction }) {
  const [acting, setActing] = useState(null); // "accepted" | "rejected"
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [showJobModal, setShowJobModal] = useState(false);

  const company  = proposal?.company || proposal?.job?.company;
  const job      = proposal?.job;
  const salary   = Number(proposal?.salary || 0);
  const created  = proposal?.created_at
    ? new Date(proposal.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : "—";

  async function handleAction(newStatus) {
    setActing(newStatus);
    try {
      await candidateApi.updateProposalStatus(proposal.id, newStatus);
      onAction(proposal.id, newStatus);
      if (newStatus === "accepted") {
        toast.success("🎉 Proposal accepted! Application created automatically.");
      } else {
        toast.info("Proposal rejected.");
      }
    } catch (err) {
      toast.error(err?.message || "Failed to update proposal.");
    } finally {
      setActing(null);
    }
  }

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-orange-100 bg-white shadow-sm transition-all hover:shadow-md hover:border-orange-200">
      {/* top accent */}
      <div className="h-1 w-full bg-gradient-to-r from-orange-400 to-orange-500" />

      <div className="p-5">
        {/* header row */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            {/* company avatar */}
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-100 text-sm font-bold text-orange-600">
              {(company?.name || "?")[0].toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-gray-900 flex items-center gap-2">
                {company?.name || "Unknown Company"}
                <button onClick={() => setShowCompanyModal(true)} className="text-xs font-normal text-orange-600 hover:underline">View Details</button>
              </p>
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <Building2 size={11} />
                {company?.location || "—"}
              </p>
            </div>
          </div>
          <StatusBadge status={proposal.status} />
        </div>

        {/* job */}
        <div className="mt-4 flex items-center justify-between gap-2 rounded-lg bg-orange-50 px-3 py-2">
          <div className="flex items-center gap-2">
            <Briefcase size={14} className="text-orange-500 shrink-0" />
            <span className="text-sm font-medium text-gray-800">{job?.title || `Job #${proposal.job_id}`}</span>
          </div>
          <button onClick={() => setShowJobModal(true)} className="text-xs text-orange-600 hover:underline">View Job</button>
        </div>

        {/* message */}
        {proposal.message && (
          <div className="mt-3 flex gap-2">
            <MessageSquare size={14} className="mt-0.5 shrink-0 text-gray-400" />
            <p className="text-sm text-gray-600 italic leading-relaxed">&ldquo;{proposal.message}&rdquo;</p>
          </div>
        )}

        {/* date */}
        <div className="mt-3 flex items-center gap-1.5 text-xs text-gray-400">
          <Calendar size={12} />
          Received on {created}
        </div>

        {salary > 0 && (
          <div className="mt-3 rounded-lg border border-orange-100 bg-orange-50 px-3 py-2 text-sm font-medium text-orange-700">
            Offered salary: NPR {salary.toLocaleString("en-NP")}
          </div>
        )}

        {/* actions – only for pending */}
        {proposal.status === "pending" && (
          <div className="mt-4 flex gap-3 border-t border-orange-50 pt-4">
            <button
              onClick={() => handleAction("accepted")}
              disabled={!!acting}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-500 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-600 disabled:opacity-60"
            >
              <CheckCircle size={15} />
              {acting === "accepted" ? "Accepting…" : "Accept"}
            </button>
            <button
              onClick={() => handleAction("rejected")}
              disabled={!!acting}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 py-2.5 text-sm font-semibold text-rose-600 transition hover:bg-rose-100 disabled:opacity-60"
            >
              <XCircle size={15} />
              {acting === "rejected" ? "Rejecting…" : "Reject"}
            </button>
          </div>
        )}

        {/* accepted success message */}
        {proposal.status === "accepted" && (
          <div className="mt-4 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700">
            <CheckCircle size={14} />
            Application created automatically — check My Applications.
          </div>
        )}
      </div>

      <Modal isOpen={showCompanyModal} onClose={() => setShowCompanyModal(false)} title="Company Details">
        <div className="space-y-4">
          {company?.logo_url && (
            <div className="flex justify-center mb-4">
              <img src={company.logo_url} alt={`${company.name} logo`} className="h-16 w-16 rounded-xl object-cover border border-gray-100 shadow-sm" />
            </div>
          )}
          <div>
            <h3 className="text-sm font-medium text-gray-500">Company Name</h3>
            <p className="text-base font-semibold text-gray-900">{company?.name || "Unknown Company"}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500">Location</h3>
            <p className="text-base text-gray-900">{company?.location || "Not specified"}</p>
          </div>
          {company?.website_url && (
            <div>
              <h3 className="text-sm font-medium text-gray-500">Website</h3>
              <a href={company.website_url} target="_blank" rel="noopener noreferrer" className="text-base text-orange-600 hover:underline break-all">
                {company.website_url}
              </a>
            </div>
          )}
          {company?.description && (
            <div>
              <h3 className="text-sm font-medium text-gray-500">Description</h3>
              <p className="text-sm text-gray-700 whitespace-pre-line">{company.description}</p>
            </div>
          )}
        </div>
      </Modal>

      <Modal isOpen={showJobModal} onClose={() => setShowJobModal(false)} title="Job Details">
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
          <div>
            <h3 className="text-sm font-medium text-gray-500">Job Title</h3>
            <p className="text-base font-semibold text-gray-900">{job?.title || `Job #${proposal.job_id}`}</p>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            {job?.job_type && (
              <div>
                <h3 className="text-sm font-medium text-gray-500">Job Type</h3>
                <p className="text-sm text-gray-900 capitalize">{job.job_type.replace('_', ' ')}</p>
              </div>
            )}
            {job?.location && (
              <div>
                <h3 className="text-sm font-medium text-gray-500">Location</h3>
                <p className="text-sm text-gray-900">{job.location}</p>
              </div>
            )}
            {job?.min_salary !== undefined && job?.max_salary !== undefined && (
              <div>
                <h3 className="text-sm font-medium text-gray-500">Salary</h3>
                <p className="text-sm text-gray-900">{job.currency || 'NPR'} {job.min_salary} - {job.max_salary}</p>
              </div>
            )}
            {job?.experience_level && (
              <div>
                <h3 className="text-sm font-medium text-gray-500">Experience Level</h3>
                <p className="text-sm text-gray-900 capitalize">{job.experience_level}</p>
              </div>
            )}
            {job?.required_experience !== undefined && (
              <div>
                <h3 className="text-sm font-medium text-gray-500">Required Experience</h3>
                <p className="text-sm text-gray-900">{job.required_experience} years</p>
              </div>
            )}
            {job?.is_remote !== undefined && (
              <div>
                <h3 className="text-sm font-medium text-gray-500">Remote Working</h3>
                <p className="text-sm text-gray-900">{job.is_remote ? 'Yes' : 'No'}</p>
              </div>
            )}
            {job?.project_duration_days && (
              <div>
                <h3 className="text-sm font-medium text-gray-500">Duration</h3>
                <p className="text-sm text-gray-900">{job.project_duration_days} days</p>
              </div>
            )}
            {job?.deadline && (
              <div>
                <h3 className="text-sm font-medium text-gray-500">Deadline</h3>
                <p className="text-sm text-gray-900">{new Date(job.deadline).toLocaleDateString()}</p>
              </div>
            )}
          </div>

          {job?.JobSkills && job.JobSkills.length > 0 && (
            <div className="pt-2 border-t border-gray-100">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Required Skills</h3>
              <div className="flex flex-wrap gap-2">
                {job.JobSkills.map((js) => (
                  <span key={js.id} className="inline-flex items-center rounded-md bg-orange-50 px-2 py-1 text-xs font-medium text-orange-700 ring-1 ring-inset ring-orange-600/10">
                    {js?.Skill?.name || "Unknown Skill"}
                    {js?.required_level && <span className="ml-1 opacity-75 capitalize">({js.required_level})</span>}
                  </span>
                ))}
              </div>
            </div>
          )}

          {job?.description && (
            <div className="pt-2 border-t border-gray-100">
              <h3 className="text-sm font-medium text-gray-500 mb-1">Description</h3>
              <p className="text-sm text-gray-700 whitespace-pre-line">{job.description}</p>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}

export default function Proposals() {
  const [proposals, setProposals] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);

  async function load() {
    try {
      setLoading(true);
      setError(null);
      const data = await candidateApi.getProposals();
      setProposals(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err?.message || "Failed to load proposals.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  // Optimistically update status in local state after action
  function handleAction(proposalId, newStatus) {
    setProposals((prev) =>
      prev.map((p) => (p.id === proposalId ? { ...p, status: newStatus } : p))
    );
  }

  const counts = {
    pending:  proposals.filter((p) => p.status === "pending").length,
    accepted: proposals.filter((p) => p.status === "accepted").length,
    rejected: proposals.filter((p) => p.status === "rejected").length,
  };

  return (
    <div className="space-y-6">
      {/* header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Job Proposals</h1>
          <p className="text-sm text-gray-600">Proposals sent to you by companies</p>
        </div>
        {proposals.length > 0 && (
          <div className="flex gap-3 text-sm">
            <span className="rounded-full bg-yellow-100 px-3 py-1 font-medium text-yellow-800">{counts.pending} pending</span>
            <span className="rounded-full bg-emerald-100 px-3 py-1 font-medium text-emerald-800">{counts.accepted} accepted</span>
            <span className="rounded-full bg-rose-100 px-3 py-1 font-medium text-rose-800">{counts.rejected} rejected</span>
          </div>
        )}
      </div>

      {loading ? (
        <LoadingSkeleton rows={3} columns={1} />
      ) : error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</div>
      ) : proposals.length === 0 ? (
        <EmptyState
          title="No proposals yet"
          message="Companies will send you job proposals here. Keep your profile updated to attract more attention!"
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {proposals.map((p) => (
            <ProposalCard key={p.id} proposal={p} onAction={handleAction} />
          ))}
        </div>
      )}
    </div>
  );
}
