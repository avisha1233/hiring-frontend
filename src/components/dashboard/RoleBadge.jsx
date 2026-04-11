export function RoleBadge({ role }) {
  const roleStyles = {
    admin: "bg-[#1a3a4a] text-[#00d09c] border border-[#2d5a7a]",
    company: "bg-[#1a3a4a] text-[#00d09c] border border-[#2d5a7a]",
    candidate: "bg-[#2a2a3a] text-[#a8bbd5] border border-[#3a3a5a]",
    hr: "bg-[#1a3a4a] text-[#00d09c] border border-[#2d5a7a]",
  };

  const displayRole = role?.toLowerCase() || "candidate";
  const styles = roleStyles[displayRole] || roleStyles.candidate;
  const label = displayRole.charAt(0).toUpperCase() + displayRole.slice(1);

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${styles}`}
    >
      {label}
    </span>
  );
}
