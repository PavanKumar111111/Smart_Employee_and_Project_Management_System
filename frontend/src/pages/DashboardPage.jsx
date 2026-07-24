import { useState, useEffect } from "react";
import { AppShell } from "../components/layout/AppShell";
import { useAuth } from "../hooks/useAuth";
import api from "../api/axios";
import { LoadingSpinner } from "../components/ui/LoadingSpinner";
import { UserProfileModal } from "../components/profile/UserProfileModal";
import {
  Users,
  FolderKanban,
  CheckSquare,
  Calendar,
  RefreshCw,
  Layers,
  Award,
  CheckCircle2,
  PlayCircle,
  Mail,
  Building2,
  Camera,
  User,
} from "lucide-react";
import toast from "react-hot-toast";

export function DashboardPage() {
  const { employee, fetchUserProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [adminStats, setAdminStats] = useState(null);
  const [employeeStats, setEmployeeStats] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = async () => {
    setRefreshing(true);
    try {
      if (employee?.role === "ADMIN") {
        const res = await api.get("/dashboard/admin");
        setAdminStats(res.data);
      } else {
        const res = await api.get("/dashboard/employee");
        setEmployeeStats(res.data);
      }
    } catch (err) {
      console.error("Error fetching dashboard stats", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (employee) {
      fetchStats();
    }
  }, [employee]);

  const toggleProjectStatus = async (projectId, currentStatus) => {
    const nextStatus =
      currentStatus === "COMPLETED" ? "IN_PROGRESS" : "COMPLETED";
    try {
      await api.patch(`/projects/${projectId}/status`, { status: nextStatus });
      toast.success(
        `Project marked as ${nextStatus === "COMPLETED" ? "Completed" : "Active"}`,
      );
      fetchStats();
    } catch (err) {
      console.error("Failed to update project status", err);
      toast.error("Failed to update project status");
    }
  };

  if (loading) {
    return (
      <AppShell>
        <div className="flex h-[60vh] items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      </AppShell>
    );
  }

  if (employee?.role === "ADMIN") {
    const stats = adminStats;
    return (
      <AppShell>
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Administrator Dashboard
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Overview of system operations, metrics, and audit logs.
            </p>
          </div>
          <button
            onClick={fetchStats}
            disabled={refreshing}
            className="swiss-btn flex h-10 px-3 items-center justify-center gap-1.5 shadow-sm"
          >
            <RefreshCw
              className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </button>
        </div>

        {/* Grid stats */}
        <div className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-3">
          <div className="glass-card mouse-glow-card p-5">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-350">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">
                  Total Employees
                </p>
                <h3 className="text-2xl font-extrabold text-gray-900 dark:text-white">
                  {stats.totalEmployees}
                </h3>
              </div>
            </div>
          </div>

          <div className="glass-card mouse-glow-card p-5">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-350">
                <FolderKanban className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">
                  In Progress Projects
                </p>
                <h3 className="text-2xl font-extrabold text-gray-900 dark:text-white">
                  {stats.inProgressProjects}
                </h3>
              </div>
            </div>
          </div>

          <div className="glass-card mouse-glow-card p-5">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-350">
                <Award className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">
                  Completed Projects
                </p>
                <h3 className="text-2xl font-extrabold text-gray-900 dark:text-white">
                  {stats.completedProjects}
                </h3>
              </div>
            </div>
          </div>
        </div>

        {/* Sub-grid charts and summaries */}
        <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="glass-card mouse-glow-card p-5 lg:col-span-2">
            <h3 className="mb-4 text-lg font-bold text-gray-900 dark:text-white">
              Task Completion Metrics
            </h3>
            <div className="space-y-4">
              {Object.entries(stats.tasksByStatus)
                .filter(([status]) => status !== "DONE")
                .map(([status, count]) => {
                  const total =
                    Object.values(stats.tasksByStatus).reduce(
                      (a, b) => a + b,
                      0,
                    ) || 1;
                  const percentage = Math.round((count / total) * 100);
                  let color = "bg-teal-600";
                  if (status === "TO_DO") color = "bg-gray-400";
                  if (status === "IN_PROGRESS") color = "bg-blue-500";
                  if (status === "IN_REVIEW") color = "bg-yellow-500";
                  return (
                    <div key={status}>
                      <div className="mb-1.5 flex items-center justify-between text-sm">
                        <span className="font-semibold text-gray-700">
                          {status.replace("_", " ")}
                        </span>
                        <span className="text-gray-500">
                          {count} ({percentage}%)
                        </span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-gray-100">
                        <div
                          className={`h-2 rounded-full ${color}`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          <div className="glass-card mouse-glow-card p-5">
            <h3 className="mb-4 text-lg font-bold text-gray-900 dark:text-white">
              Project Status Summary
            </h3>
            <div className="space-y-3.5">
              {Object.entries(stats.projectsByStatus).map(([status, count]) => {
                let badgeColor = "bg-teal-50 text-teal-700";
                if (status === "PLANNED")
                  badgeColor = "bg-gray-100 text-gray-700";
                if (status === "ON_HOLD") badgeColor = "bg-red-50 text-red-700";
                if (status === "IN_PROGRESS")
                  badgeColor = "bg-blue-50 text-blue-700";
                return (
                  <div
                    key={status}
                    className="flex items-center justify-between rounded-lg border border-gray-100 p-2.5"
                  >
                    <span
                      className={`rounded-md px-2 py-1 text-xs font-bold ${badgeColor}`}
                    >
                      {status}
                    </span>
                    <span className="text-sm font-semibold text-gray-900">
                      {count} Project(s)
                    </span>
                  </div>
                );
              })}
              {Object.keys(stats.projectsByStatus).length === 0 && (
                <p className="text-center text-sm text-gray-500">
                  No projects added yet.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Audit Logs */}
        <div className="glass-card mouse-glow-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              System Activity & Audit Trail
            </h3>
            <span className="rounded-full bg-teal-50 px-2.5 py-0.5 text-xs font-semibold text-teal-700">
              Realtime
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-500">
              <thead className="bg-gray-50 text-xs uppercase text-gray-700">
                <tr>
                  <th className="px-4 py-3">Timestamp</th>
                  <th className="px-4 py-3">Action</th>
                  <th className="px-4 py-3">Employee</th>
                  <th className="px-4 py-3">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {stats.recentLogs?.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-gray-400">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-905">
                      {log.action}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{log.username}</td>
                    <td className="px-4 py-3 text-gray-500">{log.details}</td>
                  </tr>
                ))}
                {(!stats.recentLogs || stats.recentLogs.length === 0) && (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-gray-400">
                      No activities logged yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </AppShell>
    );
  }

  // Employee view
  const stats = employeeStats;
  const initials = employee?.name
    ? employee.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  return (
    <AppShell>
      {/* Employee Profile Card Section */}
      <div className="mb-6 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-5">
            {/* Clickable Profile Image Container */}
            <div 
              className="group relative h-20 w-20 shrink-0 cursor-pointer overflow-hidden rounded-full border-2 border-teal-500 transition-transform active:scale-95" 
              onClick={() => setProfileModalOpen(true)}
              title="Click to view details and change photo"
            >
              {employee?.profilePictureUrl ? (
                <img
                  src={employee.profilePictureUrl}
                  alt={employee.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-teal-100 text-2xl font-bold text-teal-700 dark:bg-teal-950 dark:text-teal-300">
                  {initials}
                </div>
              )}
              {/* View Profile Hover Overlay */}
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 opacity-0 transition-opacity group-hover:opacity-100">
                <User className="h-5 w-5 text-white" />
                <span className="mt-1 text-[10px] font-medium text-white">Details</span>
              </div>
            </div>
            
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">{employee?.name}</h2>
              <p className="text-sm font-semibold text-teal-600 dark:text-teal-400">{employee?.designation || "Employee"}</p>
              <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
                <span className="flex items-center gap-1">
                  <Mail className="h-3.5 w-3.5 text-gray-400" /> {employee?.email}
                </span>
                {employee?.department && (
                  <span className="flex items-center gap-1">
                    <Building2 className="h-3.5 w-3.5 text-gray-400" /> {employee.department}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Welcome Back, {employee?.name}!
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Here's your work summary, tasks progress, and upcoming deadlines.
          </p>
        </div>
        <button
          onClick={fetchStats}
          disabled={refreshing}
          className="swiss-btn flex h-10 px-3 items-center justify-center gap-1.5 shadow-sm"
        >
          <RefreshCw
            className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
          />
          Refresh
        </button>
      </div>

      {/* Grid stats */}
      <div className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-6">
        <div className="glass-card mouse-glow-card p-5">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-350">
              <Layers className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">
                Assigned Tasks
              </p>
              <h3 className="text-2xl font-extrabold text-gray-900 dark:text-white">
                {stats.totalTasks}
              </h3>
            </div>
          </div>
        </div>

        <div className="glass-card mouse-glow-card p-5">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-350">
              <Award className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">
                Completed Tasks
              </p>
              <h3 className="text-2xl font-extrabold text-gray-900 dark:text-white">
                {stats.completedTasks}
              </h3>
            </div>
          </div>
        </div>

        <div className="glass-card mouse-glow-card p-5">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-350">
              <RefreshCw className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">
                In Progress
              </p>
              <h3 className="text-2xl font-extrabold text-gray-900 dark:text-white">
                {stats.inProgressTasks}
              </h3>
            </div>
          </div>
        </div>

        <div className="glass-card mouse-glow-card p-5">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-yellow-50 dark:bg-yellow-950 text-yellow-750 dark:text-yellow-350">
              <Calendar className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">
                Pending Tasks
              </p>
              <h3 className="text-2xl font-extrabold text-gray-900 dark:text-white">
                {stats.pendingTasks}
              </h3>
            </div>
          </div>
        </div>

        <div className="glass-card mouse-glow-card p-5">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-350">
              <FolderKanban className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">
                Total Projects
              </p>
              <h3 className="text-2xl font-extrabold text-gray-900 dark:text-white">
                {stats.totalProjects || 0}
              </h3>
            </div>
          </div>
        </div>

        <div className="glass-card mouse-glow-card p-5">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-350">
              <CheckSquare className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">
                Completed Proj
              </p>
              <h3 className="text-2xl font-extrabold text-gray-900 dark:text-white">
                {stats.completedProjects || 0}
              </h3>
            </div>
          </div>
        </div>
      </div>

      {/* Split Section: Projects & Deadlines */}
      <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Assigned Projects */}
        <div className="glass-card mouse-glow-card p-5 lg:col-span-2">
          <h3 className="mb-4 text-lg font-bold text-gray-900 dark:text-white">
            Your Assigned Projects
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-500">
              <thead className="bg-gray-50 text-xs uppercase text-gray-700">
                <tr>
                  <th className="px-4 py-3">Project</th>
                  <th className="px-4 py-3">Key</th>
                  <th className="px-4 py-3">Priority</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                 {stats.assignedProjects?.map((project) => (
                  <tr key={project.id} className={`hover:bg-gray-50/80 transition-colors ${project.status === "COMPLETED" ? "bg-green-50/60 dark:bg-green-950/20" : ""}`}>
                    <td className="px-4 py-3 font-semibold text-gray-950">
                      {project.name}
                    </td>
                    <td className="px-4 py-3 font-mono font-bold text-xs text-teal-700">
                      {project.key}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded px-1.5 py-0.5 text-xs font-bold ${project.priority === "HIGH" ? "bg-red-50 text-red-700" : project.priority === "MEDIUM" ? "bg-yellow-50 text-yellow-700" : "bg-gray-100 text-gray-600"}`}
                      >
                        {project.priority}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${project.status === "COMPLETED" ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"}`}
                      >
                        {project.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() =>
                          toggleProjectStatus(project.id, project.status)
                        }
                        className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-semibold transition-all active:scale-[0.98] ${project.status === "COMPLETED" ? "bg-gray-150 text-gray-700 hover:bg-gray-200" : "bg-emerald-600 text-white hover:bg-emerald-700"}`}
                      >
                        {project.status === "COMPLETED" ? (
                          <>
                            <PlayCircle className="h-3.5 w-3.5" />
                            Mark Active
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Mark Completed
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
                {(!stats.assignedProjects ||
                  stats.assignedProjects.length === 0) && (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-gray-400">
                      No projects assigned to you.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="glass-card mouse-glow-card p-5">
          <h3 className="mb-4 text-lg font-bold text-gray-900 dark:text-white">
            Upcoming Deadlines
          </h3>
          <div className="space-y-4">
            {stats.upcomingDeadlines.map((deadline) => (
              <div
                key={deadline.projectId}
                className="rounded-lg border border-gray-150 p-3.5 hover:shadow-sm"
              >
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="font-bold text-gray-900 text-sm">
                    {deadline.projectName}
                  </span>
                  <span className="rounded bg-teal-50 px-1.5 py-0.5 text-xs font-mono font-bold text-teal-700">
                    {deadline.projectKey}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>
                    Deadline:{" "}
                    <b className="text-gray-700">{deadline.deadline}</b>
                  </span>
                  <span
                    className={`font-semibold ${deadline.status === "COMPLETED" ? "text-green-600" : "text-blue-600"}`}
                  >
                    {deadline.status}
                  </span>
                </div>
              </div>
            ))}
            {stats.upcomingDeadlines.length === 0 && (
              <p className="text-center text-sm text-gray-500 py-6">
                No upcoming deadlines.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Tasks list */}
      <div className="glass-card mouse-glow-card p-5">
        <h3 className="mb-4 text-lg font-bold text-gray-900 dark:text-white">
          Your Assigned Tasks
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-500">
            <thead className="bg-gray-50 text-xs uppercase text-gray-700">
              <tr>
                <th className="px-4 py-3">Task ID</th>
                <th className="px-4 py-3">Project</th>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Priority</th>
                <th className="px-4 py-3">Progress</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {stats.tasks.map((task) => (
                <tr key={task.id} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-4 py-3 font-mono font-bold text-teal-700 text-xs">
                    {task.issueKey}
                  </td>
                  <td className="px-4 py-3 text-gray-950 font-semibold">
                    {task.projectName}
                  </td>
                  <td className="px-4 py-3 text-gray-700 font-medium truncate max-w-[200px]">
                    {task.title}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded px-1.5 py-0.5 text-xs font-bold ${task.priority === "HIGH" ? "bg-red-50 text-red-700" : task.priority === "MEDIUM" ? "bg-yellow-50 text-yellow-700" : "bg-gray-100 text-gray-600"}`}
                    >
                      {task.priority}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-semibold text-xs text-gray-700">
                    {task.progress}%
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${task.status === "DONE" ? "bg-green-100 text-green-800" : task.status === "IN_PROGRESS" ? "bg-blue-100 text-blue-800" : task.status === "IN_REVIEW" ? "bg-yellow-100 text-yellow-800" : "bg-gray-100 text-gray-800"}`}
                    >
                      {task.status.replace("_", " ")}
                    </span>
                  </td>
                </tr>
              ))}
              {stats.tasks.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-gray-400">
                    No tasks assigned to you. Enjoy your day!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <UserProfileModal
        open={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        employee={employee}
        onPhotoUpdated={fetchUserProfile}
      />
    </AppShell>
  );
}
