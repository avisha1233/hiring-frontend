export function Button({
  children,
  className = "",
  variant = "primary",
  size = "md",
  type = "button",
  ...props
}) {
  const variants = {
    primary:
      "border border-transparent bg-[var(--dash-accent)] text-white hover:bg-[var(--dash-accent-strong)]",
    outline:
      "border border-[var(--dash-border)] bg-[var(--dash-surface)] text-[var(--dash-muted)] hover:border-[var(--dash-accent)] hover:bg-[var(--dash-accent-soft)] hover:text-[var(--dash-accent)]",
    ghost:
      "border border-transparent bg-transparent text-[var(--dash-muted)] hover:bg-[var(--dash-accent-soft)] hover:text-[var(--dash-accent)]",
    danger:
      "border border-[#fecaca] bg-[#fff1f2] text-[var(--dash-danger)] hover:bg-[#ffe4e6]",
  };

  const sizes = {
    md: "h-10 px-4 text-sm font-semibold",
    icon: "h-10 w-10 text-sm",
    sm: "h-9 px-3 text-sm font-medium",
  };

  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-2 rounded-xl transition ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
