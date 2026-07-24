import { useState, useRef } from "react";
import { X, Camera, Mail, Shield, Building2, User, Phone, Briefcase } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../api/axios";

export function UserProfileModal({ open, onClose, employee, onPhotoUpdated }) {
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  if (!open || !employee) return null;

  const initials = employee.name
    ? employee.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be smaller than 5MB");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    setUploading(true);
    const uploadToast = toast.loading("Uploading profile picture...");
    try {
      await api.post(`/employees/${employee.id}/profile-picture`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      toast.success("Profile picture updated successfully!", { id: uploadToast });
      if (onPhotoUpdated) {
        await onPhotoUpdated();
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || "Failed to upload profile picture";
      toast.error(errMsg, { id: uploadToast });
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div 
        className="w-full max-w-md overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl transition-all dark:border-gray-800 dark:bg-gray-900"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="mb-6 flex items-center justify-between border-b pb-3 dark:border-gray-800">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <User className="h-5 w-5 text-teal-600" />
            My Profile Details
          </h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-150 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-col items-center gap-6">
          {/* Clickable Profile Picture */}
          <div className="group relative h-28 w-28 shrink-0 cursor-pointer overflow-hidden rounded-full border-4 border-teal-500 shadow-md transition-transform active:scale-95" onClick={() => fileInputRef.current?.click()}>
            {employee.profilePictureUrl ? (
              <img
                src={employee.profilePictureUrl}
                alt={employee.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-teal-100 text-3xl font-bold text-teal-700 dark:bg-teal-955 dark:text-teal-350">
                {initials}
              </div>
            )}
            {/* Change Photo Hover Overlay */}
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 opacity-0 transition-opacity group-hover:opacity-100">
              <Camera className="h-6 w-6 text-white" />
              <span className="mt-1 text-xs font-semibold text-white">Upload New</span>
            </div>
            {uploading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              </div>
            )}
          </div>
          
          <p className="text-[11px] text-gray-400 dark:text-gray-500 text-center font-medium">
            Click on the profile image above to upload a new picture.
          </p>

          {/* Details Form Grid */}
          <div className="w-full space-y-4">
            {/* Name */}
            <div>
              <label className="mb-1 block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                Full Name
              </label>
              <div className="flex items-center gap-2 rounded-lg border border-gray-150 bg-gray-50 p-2.5 dark:border-gray-800 dark:bg-gray-950">
                <User className="h-4 w-4 text-gray-400" />
                <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                  {employee.name}
                </span>
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="mb-1 block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                Email Address
              </label>
              <div className="flex items-center gap-2 rounded-lg border border-gray-150 bg-gray-50 p-2.5 dark:border-gray-800 dark:bg-gray-955">
                <Mail className="h-4 w-4 text-gray-400" />
                <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                  {employee.email}
                </span>
              </div>
            </div>

            {/* Role */}
            <div>
              <label className="mb-1 block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                System Role
              </label>
              <div className="flex items-center gap-2 rounded-lg border border-gray-150 bg-gray-50 p-2.5 dark:border-gray-800 dark:bg-gray-955">
                <Shield className="h-4 w-4 text-teal-600" />
                <span className="text-sm font-semibold text-teal-700 dark:text-teal-400">
                  {employee.role}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Department */}
              <div>
                <label className="mb-1 block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                  Department
                </label>
                <div className="flex items-center gap-2 rounded-lg border border-gray-150 bg-gray-50 p-2.5 dark:border-gray-800 dark:bg-gray-955">
                  <Building2 className="h-4 w-4 text-gray-400" />
                  <span className="text-sm font-semibold text-gray-800 dark:text-gray-250 truncate">
                    {employee.department || "N/A"}
                  </span>
                </div>
              </div>

              {/* Designation */}
              <div>
                <label className="mb-1 block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                  Designation
                </label>
                <div className="flex items-center gap-2 rounded-lg border border-gray-150 bg-gray-50 p-2.5 dark:border-gray-800 dark:bg-gray-955">
                  <Briefcase className="h-4 w-4 text-gray-400" />
                  <span className="text-sm font-semibold text-gray-800 dark:text-gray-250 truncate">
                    {employee.designation || "N/A"}
                  </span>
                </div>
              </div>
            </div>

            {/* Phone Number */}
            <div>
              <label className="mb-1 block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                Phone Number
              </label>
              <div className="flex items-center gap-2 rounded-lg border border-gray-150 bg-gray-50 p-2.5 dark:border-gray-800 dark:bg-gray-955">
                <Phone className="h-4 w-4 text-gray-400" />
                <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                  {employee.phoneNumber || "N/A"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Hidden File Input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
        />

        {/* Close Action */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="swiss-btn px-5 py-2 text-sm font-bold text-white bg-teal-700 hover:bg-teal-800"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
