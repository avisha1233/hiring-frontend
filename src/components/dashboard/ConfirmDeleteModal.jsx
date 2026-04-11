import { AlertTriangle, X } from "lucide-react";

export function ConfirmDeleteModal({
  isOpen,
  userName,
  onConfirm,
  onCancel,
  isDeleting,
}) {
  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/60 transition-opacity"
        onClick={onCancel}
      />
      <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-[#3a1515] bg-[#1a0a0a] p-6 shadow-xl">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#3a1515]">
          <AlertTriangle size={24} className="text-[#f87171]" />
        </div>

        <h2 className="m-0 mb-2 text-lg font-semibold text-white">
          Delete User?
        </h2>
        <p className="m-0 mb-6 text-sm text-[#8ca1bd]">
          Are you sure you want to delete{" "}
          <span className="font-medium text-white">{userName}</span>? This
          action cannot be undone.
        </p>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isDeleting}
            className="flex-1 rounded-lg border border-[#1f3048] px-4 py-2 text-sm font-medium text-[#8ca1bd] hover:bg-[#1a2e42] transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex-1 rounded-lg bg-[#f87171] px-4 py-2 text-sm font-medium text-white hover:bg-[#ef5350] transition disabled:opacity-50"
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </>
  );
}
