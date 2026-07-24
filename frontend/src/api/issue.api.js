import api from "./axios";

export async function getIssuesByProject(projectId) {
  const response = await api.get(`/projects/${projectId}/issues`);

  return response.data;
}

export async function createIssue(projectId, data) {
  const response = await api.post(`/projects/${projectId}/issues`, data);
  return response.data;
}

export async function getIssue(projectId, issueId) {
  const response = await api.get(`/projects/${projectId}/issues/${issueId}`);
  return response.data;
}

export async function updateIssue(projectId, issueId, data) {
  const response = await api.put(
    `/projects/${projectId}/issues/${issueId}`,
    data,
  );
  return response.data;
}

export async function updateStatus(projectId, issueId, status) {
  const response = await api.patch(
    `/projects/${projectId}/issues/${issueId}/status`,
    { status },
  );
  return response.data;
}

export async function updateAssignee(projectId, issueId, assigneeId) {
  const response = await api.patch(
    `/projects/${projectId}/issues/${issueId}/assignee`,
    { assigneeId },
  );
  return response.data;
}

export async function deleteIssue(projectId, issueId) {
  await api.delete(`/projects/${projectId}/issues/${issueId}`);
}

export async function getProjectMembers(projectId) {
  const response = await api.get(`/projects/${projectId}/members`);
  return response.data;
}
