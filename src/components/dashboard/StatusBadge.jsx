export function StatusBadge({ status }) {
  const statusStyles = {
    active: "bg-[#0f2b22] text-[#00d09c] border border-[#1a5d49]",
    disabled: "bg-[#3a1515] text-[#f87171] border border-[#5a2c2c]",
    pending: "bg-[#3a2f15] text-[#fbbf24] border border-[#5a4a2c]",
  };

  const displayStatus = status?.toLowerCase() || "active";
  const styles = statusStyles[displayStatus] || statusStyles.active;
  const label = displayStatus.charAt(0).toUpperCase() + displayStatus.slice(1);

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${styles}`}
    >
      {label}
    </span>
  );
}
