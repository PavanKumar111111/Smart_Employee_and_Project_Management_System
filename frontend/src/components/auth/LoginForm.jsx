import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import * as authApi from "../../api/auth.api";
import { useAuth } from "../../hooks/useAuth";
import { parseError, isBackendDown } from "../../utils/errorParser";
import { ErrorBanner } from "../ui/ErrorBanner";
import { BackendDownBanner } from "../ui/BackendDownBanner";
import { LoadingSpinner } from "../ui/LoadingSpinner";

const verifyEmailFormat = (val) => {
  if (!val.trim()) return "Email is required";
  const emailTrim = val.trim();

  // 1. Length Limits
  if (emailTrim.length > 320) {
    return "Email must not exceed 320 characters";
  }

  // 2. No Spaces
  if (/\s/.test(emailTrim)) {
    return "Email cannot contain spaces";
  }

  // 3. The @ Symbol
  const atCount = (emailTrim.match(/@/g) || []).length;
  if (atCount !== 1) {
    return "Email must contain exactly one '@' symbol";
  }

  const parts = emailTrim.split("@");
  const localPart = parts[0];
  const domainPart = parts[1];

  if (!localPart) {
    return "Email username part is missing";
  }
  if (!domainPart) {
    return "Email domain part is missing";
  }

  // 4. Local Part Rules
  if (!/^[A-Za-z0-9._-]+$/.test(localPart)) {
    return "Email username can only contain letters, numbers, dots (.), underscores (_), and hyphens (-)";
  }
  if (localPart.startsWith(".")) {
    return "Email username cannot start with a dot (.)";
  }
  if (localPart.endsWith(".")) {
    return "Email username cannot end with a dot (.)";
  }
  if (localPart.includes("..")) {
    return "Email username cannot contain consecutive dots (..)";
  }

  // 5. Domain Rules
  if (!/^[A-Za-z0-9.-]+$/.test(domainPart)) {
    return "Email domain can only contain letters, numbers, hyphens (-), and dots (.)";
  }
  if (domainPart.startsWith(".") || domainPart.endsWith(".")) {
    return "Email domain cannot start or end with a dot (.)";
  }
  if (domainPart.includes("..")) {
    return "Email domain cannot contain consecutive dots (..)";
  }

  const domainParts = domainPart.split(".");
  if (domainParts.length < 2) {
    return "Email domain must contain a dot followed by a top-level domain (e.g., .com)";
  }

  const tld = domainParts[domainParts.length - 1];
  if (!/^[A-Za-z]{2,}$/.test(tld)) {
    return "Top-level domain (TLD) must contain at least two letters (e.g., .com, .org)";
  }

  return "";
};

export function LoginForm({ onSuccess }) {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [backendDown, setBackendDown] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  const validate = () => {
    const errors = {};
    const emailErr = verifyEmailFormat(email);
    if (emailErr) {
      errors.email = emailErr;
    }
    if (!password) {
      errors.password = "Password is required";
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setBackendDown(false);
    if (!validate()) return;

    setLoading(true);
    try {
      const response = await authApi.login({ email, password });
      login(response);
      onSuccess();
    } catch (err) {
      if (isBackendDown(err)) {
        setBackendDown(true);
      } else {
        setError(parseError(err));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPasswordClick = (e) => {
    e.preventDefault();
    const err = verifyEmailFormat(email);
    if (err) {
      setFieldErrors((p) => ({ ...p, email: err }));
      return;
    }
    navigate(`/forgot-password?email=${encodeURIComponent(email.trim())}`);
  };

  if (backendDown) {
    return <BackendDownBanner />;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && <ErrorBanner message={error} />}

      <div>
        <label
          htmlFor="login-email"
          className="mb-1.5 block text-sm font-medium text-gray-700"
        >
          Email <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            id="login-email"
            type="email"
            value={email}
            onChange={(e) => {
              const val = e.target.value;
              setEmail(val);
              const err = verifyEmailFormat(val);
              setFieldErrors((p) => ({ ...p, email: err }));
            }}
            placeholder="you@example.com"
            className={`w-full rounded-lg border bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition-colors focus:border-teal-500 focus:ring-2 focus:ring-teal-100 ${fieldErrors.email ? "border-red-300" : "border-gray-300"}`}
          />
        </div>
        {fieldErrors.email && (
          <p className="mt-1 text-xs text-red-650 font-semibold">❌ {fieldErrors.email}</p>
        )}
      </div>      <div>
        <label
          htmlFor="login-password"
          className="mb-1.5 block text-sm font-medium text-gray-700"
        >
          Password <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            id="login-password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setFieldErrors((p) => ({ ...p, password: undefined }));
            }}
            onBlur={validate}
            placeholder="Enter your password"
            className={`w-full rounded-lg border bg-white py-2.5 pl-10 pr-10 text-sm outline-none transition-colors focus:border-teal-500 focus:ring-2 focus:ring-teal-100 ${fieldErrors.password ? "border-red-300" : "border-gray-300"}`}
          />

          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
        {fieldErrors.password && (
          <p className="mt-1 text-xs text-red-650 font-semibold">❌ {fieldErrors.password}</p>
        )}
      </div>
      <div className="flex justify-end text-sm">
        <button
          type="button"
          onClick={handleForgotPasswordClick}
          className="font-medium text-teal-700 dark:text-teal-400 hover:text-teal-800 dark:hover:text-teal-300 hover:underline"
        >
          Forgot Password?
        </button>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-teal-800 active:scale-[0.98] disabled:opacity-50"
      >
        {loading ? <LoadingSpinner size="sm" /> : null}
        {loading ? "Signing in..." : "Sign In"}
      </button>
    </form>
  );
}
