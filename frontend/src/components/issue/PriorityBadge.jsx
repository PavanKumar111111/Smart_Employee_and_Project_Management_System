import {
  ArrowUp,
  ArrowDown,
  Minus,
  ChevronsUp,
  ChevronsDown,
} from "lucide-react";

const config = {
  HIGHEST: {
    label: "Highest",
    color: "text-red-700",
    bg: "bg-red-50 border-red-200",
    icon: ChevronsUp,
  },
  HIGH: {
    label: "High",
    color: "text-orange-700",
    bg: "bg-orange-50 border-orange-200",
    icon: ArrowUp,
  },
  MEDIUM: {
    label: "Medium",
    color: "text-yellow-700",
    bg: "bg-yellow-50 border-yellow-200",
    icon: Minus,
  },
  LOW: {
    label: "Low",
    color: "text-blue-700",
    bg: "bg-blue-50 border-blue-200",
    icon: ArrowDown,
  },
  LOWEST: {
    label: "Lowest",
    color: "text-gray-600",
    bg: "bg-gray-50 border-gray-200",
    icon: ChevronsDown,
  },
};

export function PriorityBadge({ priority }) {
  const { label, color, bg, icon: Icon } = config[priority];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${color} ${bg}`}
    >
      <Icon className="h-3 w-3" />
      {label}
    </span>
  );
}
