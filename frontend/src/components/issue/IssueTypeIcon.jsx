import { Bug, CheckSquare, BookMarked } from "lucide-react";

const config = {
  BUG: { icon: Bug, color: "text-red-500", bg: "bg-red-50" },
  TASK: { icon: CheckSquare, color: "text-blue-500", bg: "bg-blue-50" },
  STORY: { icon: BookMarked, color: "text-green-500", bg: "bg-green-50" },
};

export function IssueTypeIcon({ type, className }) {
  const { icon: Icon, color, bg } = config[type];
  return (
    <div
      className={`inline-flex items-center justify-center rounded p-1 ${bg} ${className || ""}`}
    >
      <Icon className={`h-3.5 w-3.5 ${color}`} />
    </div>
  );
}
