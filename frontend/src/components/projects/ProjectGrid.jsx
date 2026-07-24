import { ProjectCard } from "./ProjectCard";
import { BackendDownBanner } from "../ui/BackendDownBanner";
import { ErrorBanner } from "../ui/ErrorBanner";

export function ProjectGrid({
  projects,
  loading,
  error,
  backendDown,
  onEdit,
  onDelete,
}) {
  if (backendDown) {
    return (
      <div className="py-12">
        <BackendDownBanner />
      </div>
    );
  }

  if (error) {
    return <ErrorBanner message={error} />;
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-xl border border-gray-200 bg-white p-5"
          >
            <div className="skeleton mb-3 h-5 w-3/4" />
            <div className="skeleton mb-2 h-4 w-full" />
            <div className="skeleton mb-4 h-4 w-2/3" />
            <div className="flex justify-between">
              <div className="skeleton h-3 w-16" />
              <div className="skeleton h-3 w-20" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {projects.map((project) => (
        <ProjectCard
          key={project.id}
          project={project}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
