import { useNavigate } from "react-router-dom";
import { MoreVertical, Pencil, Trash2 } from "lucide-react";
import { boardRoute } from "../../constants/routes";
import { formatDate } from "../../utils/formatDate";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";

export function ProjectCard({ project, onEdit, onDelete }) {
  const navigate = useNavigate();
  const { employee } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const isAdmin = employee?.role === "ADMIN";

  useEffect(() => {
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div
      onClick={() => navigate(boardRoute(project.id))}
      className={`glass-card mouse-glow-card group relative cursor-pointer p-5 transition-all ${project.status === "COMPLETED" ? "bg-green-50/60 dark:bg-green-950/20 border-green-200" : ""}`}
    >
      {/* Kebab menu */}
      {isAdmin && (
        <div ref={menuRef} className="absolute right-3 top-3">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen(!menuOpen);
            }}
            className="flex h-8 w-8 items-center justify-center rounded-lg opacity-0 transition-opacity hover:bg-gray-100 dark:hover:bg-gray-750 group-hover:opacity-100"
          >
            <MoreVertical className="h-4 w-4 text-gray-400 dark:text-gray-300" />
          </button>
          {menuOpen && (
            <div className="glass-card absolute right-0 top-full z-10 mt-1 w-36 py-1 shadow-lg">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen(false);
                  onEdit(project);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <Pencil className="h-3.5 w-3.5" /> Edit
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen(false);
                  onDelete(project);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
              >
                <Trash2 className="h-3.5 w-3.5" /> Delete
              </button>
            </div>
          )}
        </div>
      )}

      {/* Content */}
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h3 className="text-base font-semibold text-gray-800 dark:text-white">
            {project.name}
          </h3>
          <span className="rounded bg-teal-50 dark:bg-teal-950 px-1.5 py-0.5 text-xs font-mono font-bold text-teal-700 dark:text-teal-300">
            {project.key}
          </span>
        </div>
        {project.status === "COMPLETED" && (
          <span className="rounded-full bg-green-100 dark:bg-green-900/40 px-2 py-0.5 text-xs font-semibold text-green-800 dark:text-green-300">
            Completed
          </span>
        )}
      </div>
      <p className="mb-4 line-clamp-2 text-sm text-gray-500 dark:text-gray-400">
        {project.description || "No description"}
      </p>
      <div className="flex items-center justify-between text-xs text-gray-400 dark:text-gray-500">
        <span>
          {project.issueCount} issue{project.issueCount !== 1 ? "s" : ""}
        </span>
        <span>{formatDate(project.createdAt)}</span>
      </div>
    </div>
  );
}
