export const ROUTES = {
  LOGIN: "/login",
  REGISTER: "/register",
  PROJECTS: "/projects",
  BOARD: "/projects/:projectId/board",
  NOT_FOUND: "*",
};

export function boardRoute(projectId) {
  return `/projects/${projectId}/board`;
}
