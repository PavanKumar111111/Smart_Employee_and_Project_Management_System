import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { AppShell } from "../components/layout/AppShell";
import { KanbanBoard } from "../components/board/KanbanBoard";
import { CreateIssueModal } from "../components/board/CreateIssueModal";
import { IssueDetailModal } from "../components/issue/IssueDetailModal";
import { BackendDownBanner } from "../components/ui/BackendDownBanner";
import { EmptyState } from "../components/ui/EmptyState";
import { useBoard } from "../hooks/useBoard";

export function BoardPage() {
  const { projectId } = useParams();
  const {
    project,
    boardColumns,
    loading,
    error,
    backendDown,
    moveIssue,
    createIssue,
    deleteIssue,
  } = useBoard(projectId);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedIssueId, setSelectedIssueId] = useState(null);

  if (backendDown) {
    return (
      <AppShell>
        <div className="py-12">
          <BackendDownBanner />
        </div>
      </AppShell>
    );
  }

  // Handle 404 (project not found or forbidden map to error block natively here)
  if (error && !loading && !boardColumns.TO_DO.length) {
    return (
      <AppShell>
        <EmptyState
          title="Project not available"
          description={error}
          action={
            <Link
              to="/projects"
              className="mt-4 inline-flex items-center rounded-lg bg-teal-700 px-4 py-2 text-sm text-white hover:bg-teal-800"
            >
              Back to Projects
            </Link>
          }
        />
      </AppShell>
    );
  }

  return (
    <AppShell>
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="mb-1 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <Link to="/projects" className="hover:underline">
              Projects
            </Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span>{project?.name || "Loading..."}</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {project?.name}
            </h1>
            {project?.key && (
              <span className="rounded bg-teal-50 dark:bg-teal-950 px-2 py-1 text-xs font-mono font-bold text-teal-700 dark:text-teal-300">
                {project.key}
              </span>
            )}
          </div>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="swiss-btn h-10 px-4 shadow-sm"
        >
          + Create Issue
        </button>
      </div>

      {/* Board */}
      <div className="h-[calc(100vh-14rem)] min-h-[400px]">
        <KanbanBoard
          projectId={projectId}
          boardColumns={boardColumns}
          loading={loading}
          error={error}
          onMoveIssue={moveIssue}
          onAddIssueClick={() => setShowCreateModal(true)}
          onIssueClick={(issue) => setSelectedIssueId(issue.id)}
        />
      </div>

      {/* Modals */}
      <CreateIssueModal
        open={showCreateModal}
        projectId={projectId}
        onClose={() => setShowCreateModal(false)}
        onCreated={createIssue}
      />

      <IssueDetailModal
        open={!!selectedIssueId}
        projectId={projectId}
        issueId={selectedIssueId}
        onClose={() => setSelectedIssueId(null)}
        onDeleted={deleteIssue}
      />
    </AppShell>
  );
}
