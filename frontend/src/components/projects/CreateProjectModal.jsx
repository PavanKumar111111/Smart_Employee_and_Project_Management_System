import { useState, useEffect } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { LoadingSpinner } from "../ui/LoadingSpinner";
import { ErrorBanner } from "../ui/ErrorBanner";
import { parseError } from "../../utils/errorParser";
import axios from "axios";
import api from "../../api/axios";

export function CreateProjectModal({
  open,
  onClose,
  onCreated,
  editProject,
  onUpdated,
}) {
  const [name, setName] = useState("");
  const [key, setKey] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("PLANNED");
  const [priority, setPriority] = useState("MEDIUM");
  const [deadline, setDeadline] = useState("");
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [allEmployees, setAllEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  const isEdit = !!editProject;

  useEffect(() => {
    if (open) {
      api
        .get("/search/employees")
        .then((res) => {
          setAllEmployees(res.data);
        })
        .catch((err) => console.error(err));
    }
  }, [open]);

  useEffect(() => {
    if (open && editProject) {
      setName(editProject.name);
      setKey(editProject.key);
      setDescription(editProject.description || "");
      setStatus(editProject.status || "PLANNED");
      setPriority(editProject.priority || "MEDIUM");
      setDeadline(editProject.deadline || "");
      setSelectedMembers(editProject.members?.map((m) => m.id) || []);
    } else if (open) {
      setName("");
      setKey("");
      setDescription("");
      setStatus("PLANNED");
      setPriority("MEDIUM");
      setDeadline("");
      setSelectedMembers([]);
    }
    setError(null);
    setFieldErrors({});
  }, [open, editProject]);

  const validate = () => {
    const errors = {};
    if (!name.trim()) {
      errors.name = "Project name is required";
    } else if (!/^[A-Za-z0-9 ]+$/.test(name)) {
      errors.name = "Project name must contain only alphabets, digits, and spaces (no special characters)";
    } else if (name.length > 200) {
      errors.name = "Max 200 characters";
    }

    if (!isEdit) {
      if (!key.trim()) {
        errors.key = "Project key is required";
      } else if (!/^[A-Z]{2,10}$/.test(key)) {
        errors.key = "Key must be 2-10 uppercase letters";
      }
    }
    if (description.length > 1000) errors.description = "Max 1000 characters";
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!validate()) return;

    setLoading(true);
    try {
      if (isEdit && onUpdated) {
        await onUpdated(editProject.id, {
          name: name.trim(),
          description: description.trim() || undefined,
          status,
          priority,
          deadline: deadline || undefined,
          memberIds: selectedMembers,
        });
      } else {
        await onCreated({
          name: name.trim(),
          key,
          description: description.trim() || undefined,
          status,
          priority,
          deadline: deadline || undefined,
          memberIds: selectedMembers,
        });
      }
      onClose();
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 409) {
        setFieldErrors({
          key: "This project key is already taken. Choose a different one.",
        });
      } else {
        setError(parseError(err));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-xl border border-gray-200 bg-white p-6 shadow-xl">
          <div className="mb-5 flex items-center justify-between">
            <Dialog.Title className="text-lg font-semibold text-gray-900">
              {isEdit ? "Edit Project" : "Create New Project"}
            </Dialog.Title>
            <Dialog.Close asChild>
              <button className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </Dialog.Close>
          </div>

          {error && (
            <div className="mb-4">
              <ErrorBanner message={error} />
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="project-name"
                className="mb-1.5 block text-sm font-medium text-gray-700"
              >
                Name <span className="text-red-500">*</span>
              </label>
              <input
                id="project-name"
                type="text"
                value={name}
                onChange={(e) => {
                  const val = e.target.value;
                  setName(val);
                  if (!val.trim()) {
                    setFieldErrors((p) => ({ ...p, name: "Project name is required" }));
                  } else if (!/^[A-Za-z0-9 ]+$/.test(val)) {
                    setFieldErrors((p) => ({ ...p, name: "Project name must contain only alphabets, digits, and spaces (no special characters)" }));
                  } else {
                    setFieldErrors((p) => ({ ...p, name: "" }));
                  }
                }}
                placeholder="My Awesome Project"
                className={`w-full rounded-lg border bg-white px-3 py-2.5 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 ${fieldErrors.name ? "border-red-300" : "border-gray-300"}`}
              />

              {fieldErrors.name && (
                <p className="mt-1 text-xs text-red-650 font-semibold">{fieldErrors.name}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="project-key"
                className="mb-1.5 block text-sm font-medium text-gray-700"
              >
                Key <span className="text-red-500">*</span>
              </label>
              <input
                id="project-key"
                type="text"
                value={key}
                onChange={(e) => {
                  const val = e.target.value.toUpperCase();
                  setKey(val);
                  if (!val.trim()) {
                    setFieldErrors((p) => ({ ...p, key: "Project key is required" }));
                  } else if (!/^[A-Z]{2,10}$/.test(val)) {
                    setFieldErrors((p) => ({ ...p, key: "Key must be 2-10 uppercase letters" }));
                  } else {
                    setFieldErrors((p) => ({ ...p, key: "" }));
                  }
                }}
                disabled={isEdit}
                placeholder="MAP"
                maxLength={10}
                className={`w-full rounded-lg border bg-white px-3 py-2.5 font-mono text-sm uppercase outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500 ${fieldErrors.key ? "border-red-300" : "border-gray-300"}`}
              />

              {isEdit && (
                <p className="mt-1 text-xs text-gray-500">
                  Project key cannot be changed after creation
                </p>
              )}
              {fieldErrors.key && (
                <p className="mt-1 text-xs text-red-600">{fieldErrors.key}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="project-desc"
                className="mb-1.5 block text-sm font-medium text-gray-700"
              >
                Description
              </label>
              <textarea
                id="project-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="What's this project about?"
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
              />

              {fieldErrors.description && (
                <p className="mt-1 text-xs text-red-600">
                  {fieldErrors.description}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-teal-500"
                >
                  <option value="PLANNED">Planned</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="ON_HOLD">On Hold</option>
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Priority
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-teal-500"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                </select>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Deadline
              </label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Assign Project Members
              </label>
              <div className="max-h-28 overflow-y-auto border border-gray-300 p-2.5 rounded-lg space-y-1.5 bg-gray-50">
                {allEmployees.map((emp) => {
                  const checked = selectedMembers.includes(emp.id);
                  return (
                    <label
                      key={emp.id}
                      className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => {
                          if (checked) {
                            setSelectedMembers(
                              selectedMembers.filter((id) => id !== emp.id),
                            );
                          } else {
                            setSelectedMembers([...selectedMembers, emp.id]);
                          }
                        }}
                        className="rounded border-gray-300 text-teal-700 focus:ring-teal-500"
                      />

                      {emp.name}
                    </label>
                  );
                })}
                {allEmployees.length === 0 && (
                  <p className="text-xs text-gray-400 italic">
                    No employees found to assign.
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800 disabled:opacity-50"
              >
                {loading && <LoadingSpinner size="sm" />}
                {isEdit ? "Save Changes" : "Create Project"}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
