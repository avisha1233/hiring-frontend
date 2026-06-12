import { useEffect, useState } from "react";
import StatusBadge from "../../components/shared/StatusBadge";
import EmptyState from "../../components/shared/EmptyState";
import { api } from "@/services/api";
import { getAuthUser } from "@/lib/auth";
import { formatDateTime } from "@/utils/formatters";
import { toast } from "react-toastify";

export default function CandidateProposals() {
  const [loading, setLoading] = useState(true);
  const [proposals, setProposals] = useState([]);

  const user = getAuthUser();
  const candidateId = user?.id;

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        const res = await api.get(`/proposals?candidate_id=${candidateId}`);
        if (!mounted) return;
        setProposals(res.data || res);
      } catch (err) {
        console.error(err);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    if (candidateId) load();
    return () => {
      mounted = false;
    };
  }, [candidateId]);

  const pushToast = (message, type = "success") => {
    if (type === "error") toast.error(message);
    else toast.success(message);
  };

  const handleRespond = async (id, newStatus) => {
    try {
      const res = await api.patch(`/proposals/${id}`, { newStatus });
      setProposals((prev) =>
        prev.map((p) => (String(p.id) === String(id) ? res.data || res : p)),
      );
      pushToast(`Proposal ${newStatus}`);
      if (newStatus === "accepted")
        pushToast("Application created automatically", "success");
    } catch (err) {
      pushToast(
        err?.response?.data?.message || err.message || "Failed",
        "error",
      );
    }
  };

  if (!loading && (!proposals || proposals.length === 0)) {
    return (
      <EmptyState
        title="No proposals"
        message="You have not received any proposals"
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Proposals</h1>
        <p className="text-sm text-gray-600">Proposals sent by companies</p>
      </div>

      {loading ? (
        <div className="space-y-2">Loading…</div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {proposals.map((p) => (
            <div
              key={p.id}
              className="rounded-xl border border-orange-100 bg-white p-4 shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    {p.job?.title || `Job #${p.job_id}`}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    {p.company?.name || `Company ${p.company_id}`}
                  </p>
                </div>
                <div className="text-right">
                  <StatusBadge status={p.status}>{p.status}</StatusBadge>
                </div>
              </div>

              <p className="mt-3 text-sm text-gray-700">
                {p.message || "No message provided"}
              </p>
              <div className="mt-3 flex items-center justify-between">
                <p className="text-xs text-gray-500">
                  {formatDateTime(p.created_at)}
                </p>
                {p.status === "pending" && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleRespond(p.id, "accepted")}
                      className="rounded-md bg-orange-500 px-3 py-1 text-xs font-medium text-white"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => handleRespond(p.id, "rejected")}
                      className="rounded-md border border-orange-100 px-3 py-1 text-xs font-medium text-gray-700"
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* react-toastify handles toasts globally via ToastContainer in main.jsx */}
    </div>
  );
}
