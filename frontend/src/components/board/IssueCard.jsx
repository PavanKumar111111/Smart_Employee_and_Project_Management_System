import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { IssueTypeIcon } from "../issue/IssueTypeIcon";
import { PriorityBadge } from "../issue/PriorityBadge";

export function IssueCard({ issue, onClick }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: issue.id,
      data: issue,
    });

  const style = {
    transform: CSS.Translate.toString(transform),
  };

  const assigneeInitial = issue.assigneeName
    ? issue.assigneeName[0].toUpperCase()
    : "?";

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={() => onClick(issue)}
      className={`glass-card group relative flex cursor-grab flex-col gap-2 p-3 shadow-sm transition-colors hover:bg-white/60 dark:hover:bg-slate-800/40 active:cursor-grabbing ${isDragging ? "dragging z-50 shadow-md" : "z-0"}`}
    >
      <div className="flex items-start justify-between">
        <p className="line-clamp-2 text-sm font-semibold text-gray-800 dark:text-white">
          {issue.title}
        </p>
      </div>

      <div className="mt-1 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <IssueTypeIcon type={issue.type} />
          <PriorityBadge priority={issue.priority} />
        </div>
        <div className="flex items-center gap-2 text-xs font-mono font-bold text-gray-500 dark:text-gray-400">
          {issue.issueKey}
          <div
            className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 text-[10px] text-gray-600 dark:text-gray-300"
            title={issue.assigneeName || "Unassigned"}
          >
            {issue.assigneeName ? assigneeInitial : "U"}
          </div>
        </div>
      </div>
    </div>
  );
}
