import { AlertTriangle, RefreshCw } from "lucide-react";

export function BackendDownBanner() {
  return (
    <div className="mx-auto max-w-2xl rounded-xl border border-amber-200 bg-amber-50 p-6 text-center shadow-sm">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-100">
        <AlertTriangle className="h-7 w-7 text-amber-600" />
      </div>
      <h3 className="mb-2 text-lg font-semibold text-amber-800">
        Cannot Connect to Server
      </h3>
      <p className="mb-4 text-sm text-amber-700">
        The backend server is not responding. Make sure the Spring Boot
        application is running at{" "}
        <code className="rounded bg-amber-100 px-1.5 py-0.5 font-mono text-xs">
          http://localhost:8080
        </code>{" "}
        and that CORS is configured correctly.
      </p>
      <button
        onClick={() => window.location.reload()}
        className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-amber-700 active:scale-95"
      >
        <RefreshCw className="h-4 w-4" />
        Retry
      </button>
    </div>
  );
}
