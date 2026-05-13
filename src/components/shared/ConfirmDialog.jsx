import { AlertTriangle } from "lucide-react";
import Modal from "./Modal";

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirm",
  message = "Are you sure?",
  confirmLabel = "Confirm",
  confirmStyle = "danger",
  loading = false,
  requireTyping = false,
  typingPhrase = "CONFIRM",
}) {
  const [input, setInput] = React.useState("");

  const isConfirmDisabled =
    loading || (requireTyping && input !== typingPhrase);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <div className="space-y-4">
        <div className="flex gap-3">
          <AlertTriangle className="text-red-500" size={20} />
          <p className="text-sm text-gray-600">{message}</p>
        </div>

        {requireTyping && (
          <div>
            <p className="mb-2 text-xs font-medium text-gray-700">
              Type <span className="font-bold">{typingPhrase}</span> to confirm
            </p>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={typingPhrase}
              className="w-full rounded-lg border border-orange-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>
        )}

        <div className="flex gap-2 pt-4">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 rounded-lg border border-orange-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-orange-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isConfirmDisabled}
            className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium text-white transition ${
              confirmStyle === "danger"
                ? "bg-red-500 hover:bg-red-600 disabled:bg-red-300"
                : "bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300"
            } disabled:cursor-not-allowed`}
          >
            {loading ? "Loading..." : confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}

import React from "react";
