import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { useAuthStore } from "./store/auth.store";
import { useEffect } from "react";

import { LoginPage } from "./pages/LoginPage";
import { ForgotPasswordPage } from "./pages/ForgotPasswordPage";
import { ProjectsPage } from "./pages/ProjectsPage";
import { BoardPage } from "./pages/BoardPage";
import { DashboardPage } from "./pages/DashboardPage";
import { EmployeeDirectoryPage } from "./pages/EmployeeDirectoryPage";
import { ReportsPage } from "./pages/ReportsPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { PrivateRoute } from "./components/auth/PrivateRoute";
import { PublicRoute } from "./components/auth/PublicRoute";

export default function App() {
  const initFromStorage = useAuthStore((s) => s.initFromStorage);

  useEffect(() => {
    initFromStorage();
    const theme = localStorage.getItem("theme");
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    }
  }, [initFromStorage]);

  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            borderRadius: "10px",
            background: "#1F2937",
            color: "#F9FAFB",
            fontSize: "14px",
          },
        }}
      />

      <Routes>
        {/* Public routes — redirect to /projects if already logged in */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          }
        />
        <Route
          path="/forgot-password"
          element={
            <PublicRoute>
              <ForgotPasswordPage />
            </PublicRoute>
          }
        />

        {/* Private routes — redirect to /login if not authenticated */}
        <Route element={<PrivateRoute />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/projects" element={<ProjectsPage />} />
          <Route path="/projects/:projectId/board" element={<BoardPage />} />
          <Route path="/employees" element={<EmployeeDirectoryPage />} />
          <Route path="/reports" element={<ReportsPage />} />
        </Route>

        {/* Default redirects */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}
