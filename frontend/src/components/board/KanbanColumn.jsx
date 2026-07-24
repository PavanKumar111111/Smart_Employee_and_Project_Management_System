import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Plus } from "lucide-react";
import { IssueCard } from "./IssueCard";

export function KanbanColumn({
  status,
  title,
  issues,
  onAddIssue,
  onIssueClick,
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: status,
  });

  return (
    <div className="glass-card flex h-full min-w-[280px] max-w-[320px] flex-col p-2">
      {/* Column Header */}
      <div className="mb-3 flex items-center justify-between p-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-450">
          {title}
        </h3>
        <span className="flex h-5 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-800 px-2 text-xs font-medium text-gray-600 dark:text-gray-400">
          {issues.length}
        </span>
      </div>

      {/* Droppable Area */}
      <div
        ref={setNodeRef}
        className={`flex-1 overflow-y-auto px-1 transition-colors ${isOver ? "bg-teal-50/50 dark:bg-teal-950/20 rounded-lg outline-dashed outline-2 outline-teal-300" : ""}`}
      >
        <div className="flex flex-col gap-2 pb-4">
          <SortableContext
            items={issues.map((i) => i.id)}
            strategy={verticalListSortingStrategy}
          >
            {issues.map((issue) => (
              <IssueCard key={issue.id} issue={issue} onClick={onIssueClick} />
            ))}
          </SortableContext>
        </div>
      </div>

      {/* Add Button */}
      <button
        onClick={onAddIssue}
        className="mt-2 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-gray-500 dark:text-gray-405 hover:bg-gray-200/50 dark:hover:bg-slate-800/40 hover:text-gray-800 dark:hover:text-white"
      >
        <Plus className="h-4 w-4" />
        Add issue
      </button>
    </div>
  );
}
