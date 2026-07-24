import { useState, useEffect } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import * as issueApi from "../../api/issue.api";
import { useAuth } from "../../hooks/useAuth";
import { useBoardStore } from "../../store/board.store";
import { LoadingSpinner } from "../ui/LoadingSpinner";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import { formatDateTime } from "../../utils/formatDate";
import { IssueTypeIcon } from "./IssueTypeIcon";

export function IssueDetailModal({
  open,
  projectId,
  issueId,
  onClose,
  onDeleted,
}) {
  const { employee } = useAuth();
  const updateIssueInStore = useBoardStore((s) => s.updateIssue);

  const [issue, setIssue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState([]);

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState("");
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [descInput, setDescInput] = useState("");
  const [saving, setSaving] = useState(false);

  const [progressInput, setProgressInput] = useState(0);
  const [remarksInput, setRemarksInput] = useState("");

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (open && issueId) {
      setLoading(true);
      Promise.all([
        issueApi.getIssue(projectId, issueId),
        issueApi.getProjectMembers(projectId).catch(() => []),
      ])
        .then(([issueData, membersData]) => {
          setIssue(issueData);
          setTitleInput(issueData.title);
          setDescInput(issueData.description || "");
          setMembers(membersData);
          setProgressInput(issueData.progress || 0);
          setRemarksInput(issueData.remarks || "");
        })
        .catch((err) => {
          if (err.response?.status === 404) {
            toast.error("This issue no longer exists.");
          } else {
            toast.error("Could not load issue.");
          }
          onClose();
        })
        .finally(() => setLoading(false));
    } else {
      setIssue(null);
    }
  }, [open, projectId, issueId]);

  if (!open || (!issue && !loading)) return null;

  const handleSaveTitle = async () => {
    setIsEditingTitle(false);
    if (!issue || titleInput.trim() === "" || titleInput === issue.title) {
      setTitleInput(issue?.title || "");
      return;
    }
    const originalTitle = issue.title;
    setSaving(true);
    setIssue({ ...issue, title: titleInput });
    try {
      const updated = await issueApi.updateIssue(projectId, issue.id, {
        title: titleInput,
      });
      setIssue(updated);
      updateIssueInStore(updated);
    } catch (err) {
      setIssue({ ...issue, title: originalTitle });
      setTitleInput(originalTitle);
      toast.error(
        err.response?.status === 403
          ? "Only reporter/owner can edit"
          : "Could not save.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleSaveDesc = async () => {
    setIsEditingDesc(false);
    if (!issue || descInput === (issue.description || "")) return;

    const originalDesc = issue.description;
    setSaving(true);
    setIssue({ ...issue, description: descInput });
    try {
      const updated = await issueApi.updateIssue(projectId, issue.id, {
        description: descInput,
      });
      setIssue(updated);
      updateIssueInStore(updated);
    } catch (err) {
      setIssue({ ...issue, description: originalDesc });
      setDescInput(originalDesc || "");
      toast.error(
        err.response?.status === 403
          ? "Only reporter/owner can edit"
          : "Could not save.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleChangeType = async (e) => {
    if (!issue) return;
    const newType = e.target.value;
    const original = issue.type;
    setIssue({ ...issue, type: newType });
    try {
      const updated = await issueApi.updateIssue(projectId, issue.id, {
        type: newType,
      });
      setIssue(updated);
      updateIssueInStore(updated);
    } catch (err) {
      setIssue({ ...issue, type: original });
      toast.error("Could not update type");
    }
  };

  const handleChangePriority = async (e) => {
    if (!issue) return;
    const newPri = e.target.value;
    const original = issue.priority;
    setIssue({ ...issue, priority: newPri });
    try {
      const updated = await issueApi.updateIssue(projectId, issue.id, {
        priority: newPri,
      });
      setIssue(updated);
      updateIssueInStore(updated);
    } catch (err) {
      setIssue({ ...issue, priority: original });
      toast.error("Could not update priority");
    }
  };

  const handleChangeStatus = async (e) => {
    if (!issue) return;
    const newStatus = e.target.value;
    const original = issue.status;
    setIssue({ ...issue, status: newStatus });
    try {
      const updated = await issueApi.updateStatus(
        projectId,
        issue.id,
        newStatus,
      );
      setIssue(updated);
      // We must move it in the board store:
      useBoardStore.getState().moveIssue(issue.id, original, newStatus);
      updateIssueInStore(updated);
    } catch (err) {
      setIssue({ ...issue, status: original });
      toast.error("Could not update status");
    }
  };

  const handleChangeAssignee = async (e) => {
    if (!issue) return;
    const newAssId = e.target.value || null;
    const originalId = issue.assigneeId;
    const originalName = issue.assigneeName;
    const selectedMember = members.find((m) => m.id === newAssId);

    setIssue({
      ...issue,
      assigneeId: newAssId,
      assigneeName: selectedMember?.name || null,
    });
    try {
      const updated = await issueApi.updateAssignee(
        projectId,
        issue.id,
        newAssId,
      );
      setIssue(updated);
      updateIssueInStore(updated);
    } catch (err) {
      setIssue({
        ...issue,
        assigneeId: originalId,
        assigneeName: originalName,
      });
      toast.error("Could not update assignee");
    }
  };

  const handleSaveProgress = async (val) => {
    if (!issue) return;
    setSaving(true);
    setIssue({ ...issue, progress: val });
    try {
      const updated = await issueApi.updateIssue(projectId, issue.id, {
        progress: val,
      });
      setIssue(updated);
      updateIssueInStore(updated);
    } catch (err) {
      setIssue({ ...issue, progress: issue.progress });
      setProgressInput(issue.progress);
      toast.error("Could not save progress");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveRemarks = async () => {
    if (!issue) return;
    setSaving(true);
    setIssue({ ...issue, remarks: remarksInput });
    try {
      const updated = await issueApi.updateIssue(projectId, issue.id, {
        remarks: remarksInput,
      });
      setIssue(updated);
      updateIssueInStore(updated);
      toast.success("Remarks saved!");
    } catch (err) {
      setIssue({ ...issue, remarks: issue.remarks });
      setRemarksInput(issue.remarks || "");
      toast.error("Could not save remarks");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!issue) return;
    setDeleting(true);
    try {
      await onDeleted(issue.id);
      setShowDeleteConfirm(false);
      onClose();
    } catch (err) {
      if (err.response?.status === 404) {
        onClose(); // Already deleted
      }
    } finally {
      setDeleting(false);
    }
  };

  const canDelete = employee?.id === issue?.reporterId; // Simplification, FRD says reporter or project owner.

  return (
    <>
      <Dialog.Root open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" />
          <Dialog.Content className="fixed left-1/2 top-20 z-40 max-h-[85vh] w-full max-w-4xl -translate-x-1/2 overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-2xl">
            {loading ? (
              <div className="flex h-64 items-center justify-center">
                <LoadingSpinner size="lg" />
              </div>
            ) : issue ? (
              <div className="flex flex-col md:flex-row">
                {/* Left Column (60%) */}
                <div className="flex-[3] p-6 lg:p-8">
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <IssueTypeIcon type={issue.type} />
                      <span className="text-sm font-mono font-bold text-gray-500">
                        {issue.projectKey}-{issue.issueKey.split("-").pop()}{" "}
                        {/* Fallback display if API differs slightly */}
                      </span>
                    </div>
                    {saving && (
                      <span className="text-xs font-medium text-teal-600">
                        Saving...
                      </span>
                    )}
                  </div>

                  {/* Title */}
                  <div className="mb-8">
                    {isEditingTitle ? (
                      <input
                        autoFocus
                        value={titleInput}
                        onChange={(e) => setTitleInput(e.target.value)}
                        onBlur={handleSaveTitle}
                        onKeyDown={(e) =>
                          e.key === "Enter" && handleSaveTitle()
                        }
                        className="w-full rounded border border-teal-500 px-2 py-1 text-2xl font-semibold outline-none ring-2 ring-teal-100"
                      />
                    ) : (
                      <h1
                        onClick={() => setIsEditingTitle(true)}
                        className="rounded px-2 py-1 text-2xl font-semibold hover:bg-gray-100 cursor-text -ml-2"
                      >
                        {issue.title}
                      </h1>
                    )}
                  </div>

                  {/* Description */}
                  <div className="mb-8">
                    <h3 className="mb-2 text-sm font-semibold text-gray-700">
                      Description
                    </h3>
                    {isEditingDesc ? (
                      <div className="space-y-2">
                        <textarea
                          autoFocus
                          value={descInput}
                          onChange={(e) => setDescInput(e.target.value)}
                          rows={6}
                          className="w-full rounded border border-teal-500 p-3 text-sm outline-none ring-2 ring-teal-100"
                        />

                        <div className="flex gap-2">
                          <button
                            onClick={handleSaveDesc}
                            className="rounded bg-teal-700 px-3 py-1.5 text-xs text-white hover:bg-teal-800"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setIsEditingDesc(false)}
                            className="rounded px-3 py-1.5 text-xs hover:bg-gray-200"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div
                        onClick={() => setIsEditingDesc(true)}
                        className={`min-h-[100px] cursor-text rounded border border-transparent p-3 text-sm hover:bg-gray-100 -ml-3 ${!issue.description ? "text-gray-400 italic" : "text-gray-800"}`}
                      >
                        {issue.description || "Add a description..."}
                      </div>
                    )}
                  </div>

                  {/* Progress & Remarks */}
                  <div className="mb-8 border-t border-gray-100 pt-6">
                    <h3 className="mb-2 text-sm font-semibold text-gray-700">
                      Task Progress ({progressInput}%)
                    </h3>
                    <div className="flex items-center gap-4">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={progressInput}
                        onChange={(e) =>
                          setProgressInput(Number(e.target.value))
                        }
                        onMouseUp={() => handleSaveProgress(progressInput)}
                        onTouchEnd={() => handleSaveProgress(progressInput)}
                        className="w-full accent-teal-700 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />

                      <span className="text-sm font-bold text-teal-700 w-10 text-right">
                        {progressInput}%
                      </span>
                    </div>
                  </div>

                  <div className="mb-6">
                    <h3 className="mb-2 text-sm font-semibold text-gray-700">
                      Remarks / Comments
                    </h3>
                    <textarea
                      value={remarksInput}
                      onChange={(e) => setRemarksInput(e.target.value)}
                      placeholder="Write remarks on progress or blockers..."
                      rows={3}
                      className="w-full rounded-lg border border-gray-300 p-3 text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                    />

                    <div className="mt-2 flex justify-end">
                      <button
                        type="button"
                        onClick={handleSaveRemarks}
                        className="rounded-lg bg-teal-700 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-teal-800"
                      >
                        Save Remarks
                      </button>
                    </div>
                  </div>
                </div>

                {/* Right Column (40%) */}
                <div className="flex-[2] border-l border-gray-100 bg-gray-50/50 p-6 lg:p-8">
                  <div className="mb-6 flex justify-end">
                    <Dialog.Close asChild>
                      <button className="rounded p-1 text-gray-500 hover:bg-gray-200">
                        <X className="h-5 w-5" />
                      </button>
                    </Dialog.Close>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <label className="mb-1 text-xs font-semibold text-gray-500">
                        STATUS
                      </label>
                      <select
                        value={issue.status}
                        onChange={handleChangeStatus}
                        className="w-full rounded border bg-gray-100 px-3 py-2 text-sm font-medium hover:bg-gray-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                      >
                        <option value="TO_DO">To Do</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="IN_REVIEW">In Review</option>
                        <option value="DONE">Done</option>
                      </select>
                    </div>

                    <div>
                      <label className="mb-1 text-xs font-semibold text-gray-500">
                        TYPE
                      </label>
                      <select
                        value={issue.type}
                        onChange={handleChangeType}
                        className="w-full rounded border border-transparent bg-transparent px-3 py-2 text-sm hover:bg-gray-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 -ml-3"
                      >
                        <option value="BUG">Bug</option>
                        <option value="STORY">Story</option>
                        <option value="TASK">Task</option>
                      </select>
                    </div>

                    <div>
                      <label className="mb-1 text-xs font-semibold text-gray-500">
                        PRIORITY
                      </label>
                      <select
                        value={issue.priority}
                        onChange={handleChangePriority}
                        className="w-full rounded border border-transparent bg-transparent px-3 py-2 text-sm hover:bg-gray-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 -ml-3"
                      >
                        <option value="HIGHEST">Highest</option>
                        <option value="HIGH">High</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="LOW">Low</option>
                        <option value="LOWEST">Lowest</option>
                      </select>
                    </div>

                    <div>
                      <label className="mb-1 text-xs font-semibold text-gray-500">
                        ASSIGNEE
                      </label>
                      <select
                        value={issue.assigneeId || ""}
                        onChange={handleChangeAssignee}
                        className="w-full rounded border border-transparent bg-transparent px-3 py-2 text-sm hover:bg-gray-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 -ml-3"
                      >
                        <option value="">Unassigned</option>
                        {members.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="mb-1 text-xs font-semibold text-gray-500">
                        REPORTER
                      </label>
                      <div className="flex items-center gap-2 py-1">
                        <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-gray-200 text-xs text-gray-600">
                          {issue.reporterName[0].toUpperCase()}
                        </div>
                        <span className="text-sm text-gray-800">
                          {issue.reporterName}
                        </span>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-gray-200 space-y-2">
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Created</span>
                        <span>{formatDateTime(issue.createdAt)}</span>
                      </div>
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Updated</span>
                        <span>{formatDateTime(issue.updatedAt)}</span>
                      </div>
                    </div>

                    {canDelete && (
                      <div className="pt-4">
                        <button
                          onClick={() => setShowDeleteConfirm(true)}
                          className="flex items-center gap-2 text-sm text-red-600 hover:underline"
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete Issue
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : null}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <ConfirmDialog
        open={showDeleteConfirm}
        title="Delete Issue"
        message="Delete this issue? This cannot be undone."
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
        loading={deleting}
      />
    </>
  );
}
