import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FolderKanban, Mail, Lock, Key, ArrowLeft, Eye, EyeOff, ShieldCheck } from "lucide-react";
import api from "../api/axios";
import toast from "react-hot-toast";
import { LoadingSpinner } from "../components/ui/LoadingSpinner";
import { ErrorBanner } from "../components/ui/ErrorBanner";
import { parseError } from "../utils/errorParser";

const getPasswordStrength = (pwd) => {
  if (!pwd) return { label: "", color: "#e2e8f0", width: "0%" };
  
  let hasLetters = /[A-Za-z]/.test(pwd);
  let hasDigits = /[0-9]/.test(pwd);
  let hasSpecial = /[^A-Za-z0-9]/.test(pwd);
  
  if (pwd.length >= 8 && hasLetters && hasDigits && hasSpecial) {
    return { label: "strong", color: "#22c55e", width: "100%" };
  }
  
  if (pwd.length >= 8 && hasLetters && hasDigits) {
    return { label: "moderate", color: "#eab308", width: "66.66%" };
  }
  
  return { label: "easy", color: "#f97316", width: "33.33%" };
};

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

export function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: New Password
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  // Real-time validations
  const validateEmail = (val) => {
    return verifyEmailFormat(val);
  };

  const sendOtpDirectly = async (emailVal) => {
    setError(null);
    const emailErr = validateEmail(emailVal);
    if (emailErr) {
      setFieldErrors({ email: emailErr });
      return;
    }

    setLoading(true);
    try {
      await api.post("/auth/forgot-password", { email: emailVal.trim() });
      toast.success("Verification code sent to your email!");
      setStep(2);
      setFieldErrors({});
    } catch (err) {
      setError(parseError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async (e) => {
    if (e) e.preventDefault();
    await sendOtpDirectly(email);
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const emailParam = params.get("email");
    if (emailParam) {
      const emailTrim = decodeURIComponent(emailParam).trim();
      setEmail(emailTrim);
      sendOtpDirectly(emailTrim);
    }
  }, []);

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError(null);
    if (!code.trim()) {
      setFieldErrors({ code: "Verification code is required" });
      return;
    }
    if (!/^[0-9]{6}$/.test(code.trim())) {
      setFieldErrors({ code: "Verification code must be exactly 6 digits" });
      return;
    }

    setLoading(true);
    try {
      await api.post("/auth/verify-otp", { email: email.trim(), code: code.trim() });
      toast.success("Verification successful!");
      setStep(3);
      setFieldErrors({});
    } catch (err) {
      setError(parseError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError(null);
    
    const errors = {};
    if (!password) {
      errors.password = "Password is required";
    } else if (password.length < 8) {
      errors.password = "Password must be at least 8 characters";
    }
    if (!confirmPassword) {
      errors.confirmPassword = "Please confirm your password";
    } else if (password !== confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setLoading(true);
    try {
      await api.post("/auth/reset-password", {
        email: email.trim(),
        code: code.trim(),
        newPassword: password,
      });
      toast.success("Password reset successfully! Please sign in.");
      navigate("/login");
    } catch (err) {
      setError(parseError(err));
    } finally {
      setLoading(false);
    }
  };

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
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {step === 1 && "Forgot Password"}
            {step === 2 && "Enter Verification Code"}
            {step === 3 && "Reset Password"}
          </p>
        </div>

        {error && <ErrorBanner message={error} />}

        {step === 1 && (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
              Enter your registered email address below. We will generate a verification code in the backend console to reset your password.
            </p>
            <div>
              <label htmlFor="reset-email" className="mb-1.5 block text-sm font-medium text-gray-700">
                Email Address <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  id="reset-email"
                  type="text"
                  value={email}
                  onChange={(e) => {
                    const val = e.target.value;
                    setEmail(val);
                    const err = validateEmail(val);
                    setFieldErrors((p) => ({ ...p, email: err }));
                  }}
                  placeholder="you@example.com"
                  className={`w-full rounded-lg border bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 ${fieldErrors.email ? "border-red-300" : "border-gray-300"}`}
                />
              </div>
              {fieldErrors.email && (
                <p className="mt-1 text-xs text-red-650 font-semibold">❌ {fieldErrors.email}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-teal-800 active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? <LoadingSpinner size="sm" /> : null}
              {loading ? "Sending Code..." : "Send Verification Code"}
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div className="rounded-lg bg-teal-50 dark:bg-teal-900/20 p-3.5 text-xs text-teal-800 dark:text-teal-300 border border-teal-100 dark:border-teal-900/30">
              📩 A 6-digit verification code has been sent to your email. Please check your inbox and enter the code below.
            </div>
            <div>
              <label htmlFor="reset-code" className="mb-1.5 block text-sm font-medium text-gray-700">
                6-Digit Code <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  id="reset-code"
                  type="text"
                  value={code}
                  maxLength={6}
                  onChange={(e) => {
                    const val = e.target.value;
                    setCode(val);
                    if (!val.trim()) {
                      setFieldErrors((p) => ({ ...p, code: "Verification code is required" }));
                    } else if (!/^[0-9]*$/.test(val)) {
                      setFieldErrors((p) => ({ ...p, code: "Code must contain only digits" }));
                    } else if (val.length !== 6) {
                      setFieldErrors((p) => ({ ...p, code: "Verification code must be exactly 6 digits" }));
                    } else {
                      setFieldErrors((p) => ({ ...p, code: "" }));
                    }
                  }}
                  placeholder="000000"
                  className={`w-full rounded-lg border bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 ${fieldErrors.code ? "border-red-300" : "border-gray-300"}`}
                />
              </div>
              {fieldErrors.code && (
                <p className="mt-1 text-xs text-red-650 font-semibold">❌ {fieldErrors.code}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-teal-800 active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? <LoadingSpinner size="sm" /> : null}
              {loading ? "Verifying..." : "Verify Code"}
            </button>
          </form>
        )}

        {step === 3 && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label htmlFor="new-password" className="mb-1.5 block text-sm font-medium text-gray-700">
                New Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  id="new-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    const val = e.target.value;
                    setPassword(val);
                    if (!val) {
                      setFieldErrors((p) => ({ ...p, password: "Password is required" }));
                    } else if (val.length < 8) {
                      setFieldErrors((p) => ({ ...p, password: "Password must be at least 8 characters" }));
                    } else {
                      setFieldErrors((p) => ({ ...p, password: "" }));
                    }
                  }}
                  placeholder="Min. 8 characters"
                  className={`w-full rounded-lg border bg-white py-2.5 pl-10 pr-10 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 ${fieldErrors.password ? "border-red-300" : "border-gray-300"}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {password && (
                <div className="mt-1.5">
                  <div className="h-1.5 w-full rounded-full bg-gray-200 dark:bg-gray-800 overflow-hidden">
                    <div
                      className="h-full transition-all duration-300"
                      style={{
                        width: getPasswordStrength(password).width,
                        backgroundColor: getPasswordStrength(password).color,
                      }}
                    />
                  </div>
                  <p className="mt-1 text-xs font-semibold capitalize" style={{ color: getPasswordStrength(password).color }}>
                    Password strength: {getPasswordStrength(password).label}
                  </p>
                </div>
              )}
              {fieldErrors.password && (
                <p className="mt-1 text-xs text-red-650 font-semibold">❌ {fieldErrors.password}</p>
              )}
            </div>

            <div>
              <label htmlFor="confirm-password" className="mb-1.5 block text-sm font-medium text-gray-700">
                Confirm New Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  id="confirm-password"
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => {
                    const val = e.target.value;
                    setConfirmPassword(val);
                    if (!val) {
                      setFieldErrors((p) => ({ ...p, confirmPassword: "Please confirm your password" }));
                    } else if (password !== val) {
                      setFieldErrors((p) => ({ ...p, confirmPassword: "Passwords do not match" }));
                    } else {
                      setFieldErrors((p) => ({ ...p, confirmPassword: "" }));
                    }
                  }}
                  placeholder="Re-enter new password"
                  className={`w-full rounded-lg border bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 ${fieldErrors.confirmPassword ? "border-red-300" : "border-gray-300"}`}
                />
              </div>
              {fieldErrors.confirmPassword && (
                <p className="mt-1 text-xs text-red-650 font-semibold">❌ {fieldErrors.confirmPassword}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-teal-800 active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? <LoadingSpinner size="sm" /> : null}
              {loading ? "Resetting..." : "Reset Password"}
            </button>
          </form>
        )}

        <div className="mt-6 flex justify-center">
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-teal-700 dark:text-teal-400 hover:text-teal-800 dark:hover:text-teal-300 hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
