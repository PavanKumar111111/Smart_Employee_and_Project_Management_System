import { AlertCircle, X } from "lucide-react";
import { useState } from "react";

export function ErrorBanner({ message, dismissible = true }) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-500" />
      <span className="flex-1">{message}</span>
      {dismissible && (
        <button
          onClick={() => setDismissed(true)}
          className="flex-shrink-0 rounded-md p-1 hover:bg-red-100"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
