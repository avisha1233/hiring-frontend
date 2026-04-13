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
      "border border-transparent bg-(--dash-accent) text-white hover:bg-(--dash-accent-strong)",
    outline:
      "border border-(--dash-border) bg-(--dash-surface) text-(--dash-muted) hover:border-(--dash-accent) hover:bg-(--dash-accent-soft) hover:text-(--dash-accent)",
    ghost:
      "border border-transparent bg-transparent text-(--dash-muted) hover:bg-(--dash-accent-soft) hover:text-(--dash-accent)",
    danger:
      "border border-[#fecaca] bg-[#fff1f2] text-(--dash-danger) hover:bg-[#ffe4e6]",
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

