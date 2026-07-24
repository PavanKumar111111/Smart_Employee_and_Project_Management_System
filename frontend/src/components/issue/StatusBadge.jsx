const config = {
  TO_DO: { label: "To Do", color: "text-gray-700", bg: "bg-gray-100" },
  IN_PROGRESS: {
    label: "In Progress",
    color: "text-blue-700",
    bg: "bg-blue-100",
  },
  IN_REVIEW: {
    label: "In Review",
    color: "text-purple-700",
    bg: "bg-purple-100",
  },
  DONE: { label: "Done", color: "text-green-700", bg: "bg-green-100" },
};

export function StatusBadge({ status }) {
  const { label, color, bg } = config[status];
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${color} ${bg}`}
    >
      {label}
    </span>
  );
}
