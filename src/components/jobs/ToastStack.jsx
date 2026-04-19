export function ToastStack({ toasts, onDismiss }) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[60] flex w-[min(94vw,380px)] flex-col gap-2">
      {toasts.map((toast) => {
        const style =
          toast.type === "error"
            ? "border-[#fecaca] bg-[#fff1f2] text-[#b91c1c]"
            : "border-[#fed7aa] bg-[#fff7ed] text-[#9a3412]";

        return (
          <div
            key={toast.id}
            className={`rounded-xl border px-4 py-3 shadow-(--dash-shadow) ${style}`}
          >
            <div className="flex items-start justify-between gap-3">
              <p className="m-0 text-sm font-medium">{toast.message}</p>
              <button
                type="button"
                onClick={() => onDismiss(toast.id)}
                className="rounded-md border border-current px-1.5 py-0.5 text-xs opacity-70 transition hover:opacity-100"
              >
                Close
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
