import { getInitials } from "../../utils/formatters";

export default function Avatar({ name, size = "md", className = "" }) {
  const initials = getInitials(name);
  const sizeMap = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-12 h-12 text-base",
    xl: "w-20 h-20 text-2xl",
  };

  return (
    <div
      className={`${sizeMap[size]} flex items-center justify-center rounded-full bg-orange-100 text-orange-600 font-semibold ${className}`}
    >
      {initials}
    </div>
  );
}
