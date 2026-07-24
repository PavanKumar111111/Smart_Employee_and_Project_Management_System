import {
  DndContext,
  DragOverlay,
  closestCorners,
  useSensor,
  useSensors,
  PointerSensor,
  KeyboardSensor,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { useState } from "react";
import { KanbanColumn } from "./KanbanColumn";
import { IssueCard } from "./IssueCard";
import { ErrorBanner } from "../ui/ErrorBanner";

const statusMap = {
  TO_DO: "To Do",
  IN_PROGRESS: "In Progress",
  IN_REVIEW: "In Review",
  DONE: "Done",
};

export function KanbanBoard({
  boardColumns,
  loading,
  error,
  onMoveIssue,
  onAddIssueClick,
  onIssueClick,
}) {
  const [activeIssue, setActiveIssue] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }), // Requires 5px movement to start drag
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragStart = (event) => {
    setActiveIssue(event.active.data.current);
  };

  const handleDragEnd = (event) => {
    setActiveIssue(null);
    const { active, over } = event;

    if (!over) return;

    const sourceColumnId = active.data.current.status;
    const destColumnId = over.id;

    if (sourceColumnId !== destColumnId) {
      onMoveIssue(active.id, sourceColumnId, destColumnId);
    }
  };

  if (error) {
    return <ErrorBanner message={error} />;
  }

  // Skeletons for loading state
  if (loading) {
    return (
      <div className="flex h-full gap-4 overflow-x-auto pb-4">
        {[1, 2, 3, 4].map((col) => (
          <div
            key={col}
            className="flex h-full min-w-[280px] max-w-[320px] flex-col rounded-xl bg-gray-100 p-3"
          >
            <div className="skeleton mb-4 h-5 w-24" />
            <div className="flex flex-col gap-3">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm"
                >
                  <div className="skeleton mb-4 h-4 w-3/4" />
                  <div className="flex justify-between">
                    <div className="skeleton h-4 w-12" />
                    <div className="skeleton h-4 w-12 rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex h-full gap-4 overflow-x-auto pb-4">
        {Object.keys(statusMap).map((status) => (
          <KanbanColumn
            key={status}
            status={status}
            title={statusMap[status]}
            issues={boardColumns[status]}
            onAddIssue={onAddIssueClick}
            onIssueClick={onIssueClick}
          />
        ))}
      </div>

      {/* Drag Overlay creates a "ghost" card that follows the cursor while dragging */}
      <DragOverlay>
        {activeIssue ? (
          <div className="opacity-80 rotate-2 scale-105 shadow-xl">
            <IssueCard issue={activeIssue} onClick={() => {}} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
