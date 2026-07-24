export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: "/auth/login",
    REGISTER: "/auth/register",
  },
  EMPLOYEES: {
    ME: "/employees/me",
  },
  PROJECTS: {
    BASE: "/projects",
    BY_ID: (id) => `/projects/${id}`,
    MEMBERS: (projectId) => `/projects/${projectId}/members`,
  },
  ISSUES: {
    BASE: (projectId) => `/projects/${projectId}/issues`,
    BY_ID: (projectId, issueId) => `/projects/${projectId}/issues/${issueId}`,
    STATUS: (projectId, issueId) =>
      `/projects/${projectId}/issues/${issueId}/status`,
    ASSIGNEE: (projectId, issueId) =>
      `/projects/${projectId}/issues/${issueId}/assignee`,
  },
};
