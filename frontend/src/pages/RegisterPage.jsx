import { Link, useNavigate } from "react-router-dom";
import { RegisterForm } from "../components/auth/RegisterForm";
import { FolderKanban } from "lucide-react";
import toast from "react-hot-toast";

export function RegisterPage() {
  const navigate = useNavigate();

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200 overflow-hidden p-4">
      {/* Ambient Background Glow Blobs */}
      <div className="pointer-events-none fixed -left-20 top-20 -z-10 h-[350px] w-[350px] rounded-full bg-teal-400/15 dark:bg-teal-900/10 blur-[80px] ambient-blob-1" />
      <div className="pointer-events-none fixed right-10 bottom-20 -z-10 h-[300px] w-[300px] rounded-full bg-indigo-400/15 dark:bg-indigo-900/10 blur-[80px] ambient-blob-2" />

      <div className="glass-card w-full max-w-[400px] p-8">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-teal-700">
            <FolderKanban className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-xl font-bold text-teal-700 dark:text-teal-400 leading-tight">
            Smart E&P Management System
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Create your account</p>
        </div>

        <RegisterForm
          onSuccess={() => {
            toast.success("Account created!");
            navigate("/projects");
          }}
        />

        <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
          Already have an account?{" "}
          <Link
            to="/login"
            className="font-medium text-teal-700 dark:text-teal-400 hover:text-teal-800 dark:hover:text-teal-300 hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
