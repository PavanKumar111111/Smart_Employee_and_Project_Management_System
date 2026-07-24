import { useState } from "react";
import { ConfirmDialog } from "../ui/ConfirmDialog";

export function DeleteProjectDialog({ open, project, onClose, onDeleted }) {
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    if (!project) return;
    setLoading(true);
    const success = await onDeleted(project.id);
    setLoading(false);
    if (success) onClose();
  };

  return (
    <ConfirmDialog
      open={open && !!project}
      title="Delete Project"
      message={`Delete project "${project?.name}"? This will also delete all ${project?.issueCount ?? 0} issues inside it. This cannot be undone.`}
      confirmLabel="Delete"
      onConfirm={handleConfirm}
      onCancel={onClose}
      loading={loading}
      variant="danger"
    />
  );
}
