import { MoreHorizontal } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export function DropdownMenu({ onEdit, onDelete }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const onDocumentClick = (event) => {
      if (!containerRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", onDocumentClick);
    return () => document.removeEventListener("mousedown", onDocumentClick);
  }, []);

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-[var(--dash-muted)] transition hover:bg-[var(--dash-accent-soft)] hover:text-[var(--dash-accent)]"
        aria-label="Open actions"
        onClick={() => setOpen((prev) => !prev)}
      >
        <MoreHorizontal size={18} />
      </button>

      {open ? (
        <div className="absolute right-0 z-20 mt-2 w-36 overflow-hidden rounded-xl border border-[var(--dash-border)] bg-[var(--dash-surface)] shadow-[var(--dash-shadow)]">
          <button
            type="button"
            className="block w-full px-3 py-2 text-left text-sm text-[var(--dash-text)] transition hover:bg-[var(--dash-accent-soft)]"
            onClick={() => {
              onEdit();
              setOpen(false);
            }}
          >
            Edit
          </button>
          <button
            type="button"
            className="block w-full px-3 py-2 text-left text-sm text-[var(--dash-danger)] transition hover:bg-[#fff1f2]"
            onClick={() => {
              onDelete();
              setOpen(false);
            }}
          >
            Delete
          </button>
        </div>
      ) : null}
    </div>
  );
}
