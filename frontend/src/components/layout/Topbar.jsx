import { useState, useEffect } from "react";
import { LogOut, Sun, Moon, ArrowLeftRight, Menu } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { UserProfileModal } from "../profile/UserProfileModal";
import toast from "react-hot-toast";

export function Topbar({ onToggleSidebar }) {
  const { employee, login, logout, fetchUserProfile } = useAuth();
  const navigate = useNavigate();
  const [profileModalOpen, setProfileModalOpen] = useState(false);

  const [darkMode, setDarkMode] = useState(
    () => localStorage.getItem("theme") === "dark",
  );

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [darkMode]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const isImpersonating = !!sessionStorage.getItem("adminToken");

  const handleSwitchBack = () => {
    const adminToken = sessionStorage.getItem("adminToken");
    const adminUserStr = sessionStorage.getItem("adminUser");
    if (adminToken && adminUserStr) {
      const adminUser = JSON.parse(adminUserStr);
      login({
        token: adminToken,
        employeeId: adminUser.id,
        name: adminUser.name,
        email: adminUser.email,
        role: "ADMIN",
      });
      sessionStorage.removeItem("adminToken");
      sessionStorage.removeItem("adminUser");
      toast.success("Switched back to Admin");
      window.location.href = "/employees";
    }
  };

  const initials = employee?.name
    ? employee.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  return (
    <header className="glass-nav fixed left-0 lg:left-64 right-0 top-0 z-20 flex h-14 items-center justify-between border-b px-4 md:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-750 dark:hover:text-gray-200"
          title="Toggle Sidebar"
        >
          <Menu className="h-5 w-5" />
        </button>
        {isImpersonating && (
          <div className="flex items-center gap-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 px-3 py-1.5 border border-yellow-200 dark:border-yellow-900/30">
            <span className="text-xs font-semibold text-yellow-800 dark:text-yellow-250">
              Impersonating:{" "}
              <b className="font-bold text-gray-900 dark:text-white">
                {employee?.name}
              </b>
            </span>
            <button
              onClick={handleSwitchBack}
              className="flex items-center gap-1 text-xs font-bold text-teal-700 dark:text-teal-400 hover:underline"
            >
              <ArrowLeftRight className="h-3.5 w-3.5" />
              Switch Back
            </button>
          </div>
        )}
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-750 dark:hover:text-gray-200"
          title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {darkMode ? (
            <Sun className="h-4.5 w-4.5" />
          ) : (
            <Moon className="h-4.5 w-4.5" />
          )}
        </button>
        <div 
          className="flex items-center gap-2.5 cursor-pointer hover:opacity-85 transition-opacity"
          onClick={() => setProfileModalOpen(true)}
          title="Click to view profile details & change photo"
        >
          {employee?.profilePictureUrl ? (
            <img
              src={employee.profilePictureUrl}
              alt={employee.name}
              className="h-8 w-8 rounded-full object-cover border border-teal-500"
            />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-100 dark:bg-teal-900 text-xs font-bold text-teal-700 dark:text-teal-200">
              {initials}
            </div>
          )}
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {employee?.name}
          </span>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-750 dark:hover:text-gray-200"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>

      <UserProfileModal
        open={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        employee={employee}
        onPhotoUpdated={fetchUserProfile}
      />
    </header>
  );
}
