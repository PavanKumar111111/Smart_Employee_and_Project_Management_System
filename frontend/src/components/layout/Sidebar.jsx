import { useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  FolderKanban,
  ChevronRight,
  Users,
  BarChart3,
  X,
} from "lucide-react";
import { boardRoute } from "../../constants/routes";
import { useAuth } from "../../hooks/useAuth";

export function Sidebar({ projects, loading, error, isOpen, onClose }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { employee } = useAuth();

  return (
    <aside
      className={`glass-nav fixed left-0 top-0 z-30 flex h-full w-64 flex-col border-r transition-transform duration-300 ease-in-out lg:translate-x-0 ${isOpen ? "translate-x-0" : "-translate-x-full"}`}
    >
      {/* Logo */}
      <div className="flex h-14 items-center justify-between border-b border-gray-100 dark:border-gray-700 px-5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-700">
            <FolderKanban className="h-4.5 w-4.5 text-white" />
          </div>
          <span className="text-sm font-bold text-teal-700">
            Smart E&P System
          </span>
        </div>
        {/* Mobile close button */}
        <button
          onClick={onClose}
          className="lg:hidden text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          title="Close Sidebar"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <button
          onClick={() => {
            navigate("/dashboard");
            if (onClose) onClose();
          }}
          className={`mb-1 flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
            location.pathname === "/dashboard"
              ? "bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 font-bold"
              : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:text-gray-900 dark:hover:text-gray-100"
          }`}
        >
          <LayoutDashboard className="h-4 w-4" />
          Dashboard
        </button>

        <button
          onClick={() => {
            navigate("/projects");
            if (onClose) onClose();
          }}
          className={`mb-1 flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
            location.pathname === "/projects"
              ? "bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 font-bold"
              : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:text-gray-900 dark:hover:text-gray-100"
          }`}
        >
          <FolderKanban className="h-4 w-4" />
          Projects
        </button>

        {employee?.role === "ADMIN" && (
          <button
            onClick={() => {
              navigate("/employees");
              if (onClose) onClose();
            }}
            className={`mb-1 flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              location.pathname === "/employees"
                ? "bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 font-bold"
                : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:text-gray-900 dark:hover:text-gray-100"
            }`}
          >
            <Users className="h-4 w-4" />
            Employees
          </button>
        )}

        <button
          onClick={() => {
            navigate("/reports");
            if (onClose) onClose();
          }}
          className={`mb-1 flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
            location.pathname === "/reports"
              ? "bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 font-bold"
              : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:text-gray-900 dark:hover:text-gray-100"
          }`}
        >
          <BarChart3 className="h-4 w-4" />
          Reports
        </button>

        {/* Project list */}
        <div className="mt-4">
          <h3 className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-gray-455">
            Your Projects
          </h3>
          {loading && (
            <div className="space-y-2 px-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="skeleton h-8 rounded-md" />
              ))}
            </div>
          )}
          {error && (
            <p className="px-3 text-xs text-red-500">Could not load projects</p>
          )}
          {!loading &&
            !error &&
            projects.map((project) => {
              const isActive = location.pathname.includes(
                `/projects/${project.id}`,
              );
              return (
                <button
                  key={project.id}
                  onClick={() => {
                    navigate(boardRoute(project.id));
                    if (onClose) onClose();
                  }}
                  className={`mb-0.5 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
                    isActive
                      ? "bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 font-bold"
                      : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:text-gray-900 dark:hover:text-gray-100"
                  }`}
                >
                  <span className="flex-1 truncate text-left">
                    {project.name}
                  </span>
                  <span className="rounded bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 text-xs font-mono font-bold text-teal-700 dark:text-teal-350">
                    {project.key}
                  </span>
                  {isActive && (
                    <ChevronRight className="h-3.5 w-3.5 text-teal-500" />
                  )}
                </button>
              );
            })}
        </div>
      </nav>
    </aside>
  );
}
