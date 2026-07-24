import { useNavigate } from "react-router-dom";
import { Home } from "lucide-react";
import { EmptyState } from "../components/ui/EmptyState";

export function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <EmptyState
        title="404 - Page Not Found"
        description="The page you are looking for doesn't exist or has been moved."
        action={
          <button
            onClick={() => navigate("/projects")}
            className="inline-flex items-center gap-2 rounded-lg bg-teal-700 px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-teal-800"
          >
            <Home className="h-4 w-4" />
            Back to Home
          </button>
        }
      />
    </div>
  );
}
