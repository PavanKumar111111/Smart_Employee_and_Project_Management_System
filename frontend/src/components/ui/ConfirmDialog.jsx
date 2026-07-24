import * as AlertDialog from "@radix-ui/react-alert-dialog";
import { LoadingSpinner } from "./LoadingSpinner";

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  onConfirm,
  onCancel,
  loading = false,
  variant = "danger",
}) {
  return (
    <AlertDialog.Root
      open={open}
      onOpenChange={(isOpen) => !isOpen && onCancel()}
    >
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <AlertDialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border border-gray-200 bg-white p-6 shadow-xl">
          <AlertDialog.Title className="text-lg font-semibold text-gray-900">
            {title}
          </AlertDialog.Title>
          <AlertDialog.Description className="mt-2 text-sm text-gray-600">
            {message}
          </AlertDialog.Description>
          <div className="mt-6 flex justify-end gap-3">
            <AlertDialog.Cancel asChild>
              <button
                disabled={loading}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
            </AlertDialog.Cancel>
            <AlertDialog.Action asChild>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  onConfirm();
                }}
                disabled={loading}
                className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-50 ${
                  variant === "danger"
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-teal-700 hover:bg-teal-800"
                }`}
              >
                {loading && <LoadingSpinner size="sm" />}
                {confirmLabel}
              </button>
            </AlertDialog.Action>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
