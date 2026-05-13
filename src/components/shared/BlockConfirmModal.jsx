import React, { useState } from "react";
import { ShieldX } from "lucide-react";
import Modal from "./Modal";

export default function BlockConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  name = "User",
  type = "user",
  impact = "",
  loading = false,
}) {
  const [reason, setReason] = useState("");
  const isReasonEmpty = !reason.trim();

  const typeMessage = {
    user: `This user will not be able to log in or access the platform.`,
    company: `This company will not be able to post new jobs or message candidates.`,
    candidate: `This candidate will not be able to apply to jobs or message companies.`,
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Block ${name}?`} size="sm">
      <div className="space-y-4">
        <div className="flex justify-center">
          <div className="rounded-full bg-red-100 p-4">
            <ShieldX className="text-red-400" size={32} />
          </div>
        </div>

        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-700">
            {impact || typeMessage[type] || typeMessage.user}
          </p>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Reason for blocking *
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Enter the reason for blocking this account..."
            rows={4}
            className="w-full rounded-lg border border-red-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-200"
          />
        </div>

        <div className="flex gap-2 pt-4">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 rounded-lg border border-orange-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-orange-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(reason)}
            disabled={isReasonEmpty || loading}
            className="flex-1 rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600 disabled:bg-red-300 disabled:cursor-not-allowed"
          >
            {loading ? "Blocking..." : "Block Account"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
