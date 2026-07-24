import { useState, useEffect, useCallback } from "react";
import { useBoardStore } from "../store/board.store";
import * as issueApi from "../api/issue.api";
import * as projectApi from "../api/project.api";
import { parseError, isBackendDown } from "../utils/errorParser";
import toast from "react-hot-toast";

export function useBoard(projectId) {
  const [project, setProject] = useState(null);
  const [backendDown, setBackendDown] = useState(false);
  const store = useBoardStore();

  const fetchBoard = useCallback(async () => {
    store.setLoading(true);
    store.setError(null);
    setBackendDown(false);
    try {
      const [issues, proj] = await Promise.all([
        issueApi.getIssuesByProject(projectId),
        projectApi.getProject(projectId),
      ]);
      setProject(proj);
      store.setIssues(issues);
    } catch (err) {
      if (isBackendDown(err)) {
        setBackendDown(true);
      } else {
        store.setError(parseError(err));
      }
      store.setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    store.reset();
    fetchBoard();
    return () => store.reset();
  }, [fetchBoard]);

  const moveIssue = async (issueId, fromStatus, toStatus) => {
    store.moveIssue(issueId, fromStatus, toStatus);
    try {
      await issueApi.updateStatus(projectId, issueId, toStatus);
    } catch {
      store.revertMove(issueId, fromStatus, toStatus);
      toast.error("Could not move issue. Please try again.");
    }
  };

  const createIssue = async (data) => {
    try {
      const newIssue = await issueApi.createIssue(projectId, data);
      store.addIssue(newIssue);
      toast.success("Issue created");
      return newIssue;
    } catch (err) {
      throw err;
    }
  };

  const deleteIssue = async (issueId) => {
    try {
      await issueApi.deleteIssue(projectId, issueId);
      store.removeIssue(issueId);
      toast.success("Issue deleted");
    } catch (err) {
      toast.error(parseError(err));
    }
  };

  return {
    project,
    boardColumns: store.issues,
    loading: store.loading,
    error: store.error,
    backendDown,
    moveIssue,
    createIssue,
    deleteIssue,
    refetch: fetchBoard,
  };
}
