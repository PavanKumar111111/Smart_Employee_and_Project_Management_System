import { create } from "zustand";

const emptyColumns = {
  TO_DO: [],
  IN_PROGRESS: [],
  IN_REVIEW: [],
  DONE: [],
};

export const useBoardStore = create((set) => ({
  issues: { ...emptyColumns },
  loading: true,
  error: null,

  setIssues: (issues) => {
    const columns = { ...issues };
    // Sort by position within each column
    Object.keys(columns).forEach((status) => {
      if (columns[status]) {
        columns[status].sort((a, b) => a.position - b.position);
      } else {
        columns[status] = []; // fallback if null
      }
    });
    set({ issues: columns, loading: false, error: null });
  },

  moveIssue: (issueId, fromStatus, toStatus) => {
    set((state) => {
      const fromColumn = [...state.issues[fromStatus]];
      const toColumn = [...state.issues[toStatus]];
      const issueIndex = fromColumn.findIndex((i) => i.id === issueId);
      if (issueIndex === -1) return state;

      const [issue] = fromColumn.splice(issueIndex, 1);
      const movedIssue = { ...issue, status: toStatus };
      toColumn.push(movedIssue);

      return {
        issues: {
          ...state.issues,
          [fromStatus]: fromColumn,
          [toStatus]: toColumn,
        },
      };
    });
  },

  revertMove: (issueId, fromStatus, toStatus) => {
    // Reverse: move from toStatus back to fromStatus
    set((state) => {
      const fromColumn = [...state.issues[toStatus]];
      const toColumn = [...state.issues[fromStatus]];
      const issueIndex = fromColumn.findIndex((i) => i.id === issueId);
      if (issueIndex === -1) return state;

      const [issue] = fromColumn.splice(issueIndex, 1);
      const revertedIssue = { ...issue, status: fromStatus };
      toColumn.push(revertedIssue);

      return {
        issues: {
          ...state.issues,
          [toStatus]: fromColumn,
          [fromStatus]: toColumn,
        },
      };
    });
  },

  addIssue: (issue) => {
    set((state) => ({
      issues: {
        ...state.issues,
        TO_DO: [...state.issues.TO_DO, issue],
      },
    }));
  },

  removeIssue: (issueId) => {
    set((state) => {
      const newIssues = { ...state.issues };
      Object.keys(newIssues).forEach((status) => {
        newIssues[status] = newIssues[status].filter((i) => i.id !== issueId);
      });
      return { issues: newIssues };
    });
  },

  updateIssue: (updatedIssue) => {
    set((state) => {
      const newIssues = { ...state.issues };
      Object.keys(newIssues).forEach((status) => {
        newIssues[status] = newIssues[status].map((i) =>
          i.id === updatedIssue.id ? updatedIssue : i,
        );
      });
      return { issues: newIssues };
    });
  },

  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  reset: () => set({ issues: { ...emptyColumns }, loading: true, error: null }),
}));
