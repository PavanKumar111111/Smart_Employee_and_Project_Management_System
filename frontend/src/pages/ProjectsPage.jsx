import { useState, useRef, useEffect } from "react";
import { Plus, FolderOpen, Search, Filter } from "lucide-react";
import { AppShell } from "../components/layout/AppShell";
import { ProjectGrid } from "../components/projects/ProjectGrid";
import { CreateProjectModal } from "../components/projects/CreateProjectModal";
import { DeleteProjectDialog } from "../components/projects/DeleteProjectDialog";
import { EmptyState } from "../components/ui/EmptyState";
import { useProjects } from "../hooks/useProjects";

export function ProjectsPage() {
  const {
    projects,
    loading,
    error,
    backendDown,
    createProject,
    updateProject,
    deleteProject,
  } = useProjects();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editProject, setEditProject] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [searchBasis, setSearchBasis] = useState("ALL");
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const projectsPerPage = 25;
  const filterRef = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (filterRef.current && !filterRef.current.contains(e.target)) {
        setShowFilterDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const filteredProjects = (projects || []).filter((project) => {
    let matchesQuery = true;
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      if (searchBasis === "NAME" || searchBasis === "PROJECT_NAME") {
        matchesQuery = project.name.toLowerCase().includes(query);
      } else if (searchBasis === "DEPARTMENT") {
        matchesQuery =
          project.key.toLowerCase().includes(query) ||
          (project.ownerName
            ? project.ownerName.toLowerCase().includes(query)
            : false);
      } else {
        matchesQuery =
          project.name.toLowerCase().includes(query) ||
          project.key.toLowerCase().includes(query);
      }
    }
    const matchesStatus =
      statusFilter === "ALL" || project.status === statusFilter;
    const matchesPriority =
      priorityFilter === "ALL" || project.priority === priorityFilter;
    return matchesQuery && matchesStatus && matchesPriority;
  });

  const indexOfLastProject = currentPage * projectsPerPage;
  const indexOfFirstProject = indexOfLastProject - projectsPerPage;
  const currentProjects = filteredProjects.slice(
    indexOfFirstProject,
    indexOfLastProject,
  );
  const totalPages = Math.ceil(filteredProjects.length / projectsPerPage);

  return (
    <AppShell>
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Projects</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Search, manage, and track progress on all employee projects.
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="swiss-btn inline-flex items-center justify-center gap-2 h-10 px-4 shadow-sm"
        >
          <Plus className="h-4 w-4" />
          New Project
        </button>
      </div>

      {/* Search Input and Filters */}
      {!loading && !error && !backendDown && projects.length > 0 && (
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder={`Search projects by ${searchBasis === "ALL" ? "name" : searchBasis.toLowerCase()}...`}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="swiss-input w-full bg-white py-2 pl-10 pr-4 text-sm outline-none"
            />
          </div>

          {/* Consolidated Filter Symbol dropdown */}
          <div className="relative" ref={filterRef}>
            <button
              onClick={() => setShowFilterDropdown(!showFilterDropdown)}
              className="swiss-btn flex h-10 px-3 items-center justify-center gap-1.5 shadow-sm"
              title="Filters"
            >
              <Filter className="h-4 w-4" />
              <span className="text-sm font-semibold">Filter</span>
            </button>
            {showFilterDropdown && (
              <div className="glass-card absolute right-0 mt-1 z-20 w-56 py-2 shadow-lg text-sm text-gray-700 dark:text-gray-200">
                <div className="px-3 py-1 text-xs font-bold uppercase tracking-wider text-gray-400">
                  Search Basis
                </div>
                <button
                  onClick={() => {
                    setSearchBasis("NAME");
                    setShowFilterDropdown(false);
                    setCurrentPage(1);
                  }}
                  className={`flex w-full items-center px-3 py-1.5 hover:bg-gray-50 ${searchBasis === "NAME" ? "font-bold text-teal-700" : ""}`}
                >
                  👤 Based on Names
                </button>
                <button
                  onClick={() => {
                    setSearchBasis("DEPARTMENT");
                    setShowFilterDropdown(false);
                    setCurrentPage(1);
                  }}
                  className={`flex w-full items-center px-3 py-1.5 hover:bg-gray-50 ${searchBasis === "DEPARTMENT" ? "font-bold text-teal-700" : ""}`}
                >
                  🏢 Based on Departments
                </button>
                <button
                  onClick={() => {
                    setSearchBasis("PROJECT_NAME");
                    setShowFilterDropdown(false);
                    setCurrentPage(1);
                  }}
                  className={`flex w-full items-center px-3 py-1.5 hover:bg-gray-50 ${searchBasis === "PROJECT_NAME" ? "font-bold text-teal-700" : ""}`}
                >
                  📁 Based on Project Names
                </button>
                <div className="my-1 border-t border-gray-100" />

                <div className="px-3 py-1 text-xs font-bold uppercase tracking-wider text-gray-400">
                  Filter Status
                </div>
                {["ALL", "PLANNED", "IN_PROGRESS", "COMPLETED", "ON_HOLD"].map(
                  (st) => (
                    <button
                      key={st}
                      onClick={() => {
                        setStatusFilter(st);
                        setShowFilterDropdown(false);
                        setCurrentPage(1);
                      }}
                      className={`flex w-full items-center px-3 py-1.5 hover:bg-gray-50 ${statusFilter === st ? "font-bold text-teal-700" : ""}`}
                    >
                      🟢 {st.replace("_", " ")}
                    </button>
                  ),
                )}
                <div className="my-1 border-t border-gray-100" />

                <div className="px-3 py-1 text-xs font-bold uppercase tracking-wider text-gray-400">
                  Filter Priority
                </div>
                {["ALL", "HIGH", "MEDIUM", "LOW"].map((pr) => (
                  <button
                    key={pr}
                    onClick={() => {
                      setPriorityFilter(pr);
                      setShowFilterDropdown(false);
                      setCurrentPage(1);
                    }}
                    className={`flex w-full items-center px-3 py-1.5 hover:bg-gray-50 ${priorityFilter === pr ? "font-bold text-teal-700" : ""}`}
                  >
                    ⚡ {pr}
                  </button>
                ))}
                <div className="my-1 border-t border-gray-100" />
                <button
                  onClick={() => {
                    setSearchBasis("ALL");
                    setStatusFilter("ALL");
                    setPriorityFilter("ALL");
                    setSearchQuery("");
                    setShowFilterDropdown(false);
                    setCurrentPage(1);
                  }}
                  className="flex w-full items-center px-3 py-1.5 text-red-600 hover:bg-red-50"
                >
                  🔄 Reset All Filters
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {!loading && !error && !backendDown && projects.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title="No projects yet"
          description="Create your first project to get started."
          action={
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800"
            >
              <Plus className="h-4 w-4" />
              New Project
            </button>
          }
        />
      ) : !loading &&
        !error &&
        !backendDown &&
        filteredProjects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Search className="mb-3 h-10 w-10 text-gray-400" />
          <h3 className="text-lg font-medium text-gray-900">
            No projects match your search
          </h3>
          <p className="text-sm text-gray-500">
            Try checking the spelling or use a different keyword.
          </p>
        </div>
      ) : (
        <>
          <ProjectGrid
            projects={currentProjects}
            loading={loading}
            error={error}
            backendDown={backendDown}
            onEdit={setEditProject}
            onDelete={setDeleteTarget}
          />

          {/* Pagination Controls */}
          {totalPages >= 1 && (
            <div className="mt-8 flex items-center justify-center gap-1">
              <button
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="swiss-btn px-3 py-1.5 text-sm disabled:opacity-50"
              >
                Prev
              </button>
              {Array.from({ length: totalPages }).map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentPage(idx + 1)}
                  className={`px-3.5 py-1.5 text-sm font-bold ${
                    currentPage === idx + 1
                      ? "swiss-btn text-white"
                      : "swiss-btn bg-white text-gray-700"
                  }`}
                  style={
                    currentPage === idx + 1
                      ? { backgroundColor: "#0f766e", color: "#ffffff" }
                      : undefined
                  }
                >
                  {idx + 1}
                </button>
              ))}
              <button
                onClick={() =>
                  setCurrentPage((p) => Math.min(p + 1, totalPages))
                }
                disabled={currentPage === totalPages}
                className="swiss-btn px-3 py-1.5 text-sm disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      <CreateProjectModal
        open={showCreateModal || !!editProject}
        onClose={() => {
          setShowCreateModal(false);
          setEditProject(null);
        }}
        onCreated={createProject}
        editProject={editProject}
        onUpdated={updateProject}
      />

      <DeleteProjectDialog
        open={!!deleteTarget}
        project={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onDeleted={deleteProject}
      />
    </AppShell>
  );
}
