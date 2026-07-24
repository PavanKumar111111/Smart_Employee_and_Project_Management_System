import { useState } from "react";
import { Mail, Lock, Eye, EyeOff, Employee } from "lucide-react";
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

export function RegisterForm({ onSuccess }) {
  const { login } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [backendDown, setBackendDown] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [role] = useState("EMPLOYEE");
  const [department, setDepartment] = useState("");
  const [designation, setDesignation] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");

  const getPasswordStrength = () => {
    if (!password) return { level: 0, label: "", color: "" };
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    if (score <= 1) return { level: 1, label: "Weak", color: "bg-red-500" };
    if (score === 2) return { level: 2, label: "Fair", color: "bg-yellow-500" };
    if (score === 3) return { level: 3, label: "Good", color: "bg-blue-500" };
    return { level: 4, label: "Strong", color: "bg-green-500" };
  };

  const validate = () => {
    const errors = {};
    if (!name.trim()) {
      errors.name = "Name is required";
    } else if (!/^[A-Za-z0-9]+$/.test(name.trim())) {
      errors.name = "Username must contain only alphabets and digits (no spaces or special characters)";
    }

    const emailErr = verifyEmailFormat(email);
    if (emailErr) {
      errors.email = emailErr;
    }

    if (!department.trim()) {
      errors.department = "Department is required";
    } else if (!/^[A-Za-z\s\-]+$/.test(department.trim())) {
      errors.department = "Department must contain only letters";
    }

    if (!designation.trim()) {
      errors.designation = "Designation is required";
    } else if (!/^[A-Za-z\s\-]+$/.test(designation.trim())) {
      errors.designation = "Designation must contain only letters";
    }

    if (!phoneNumber.trim()) {
      errors.phoneNumber = "Phone number is required";
    } else if (!/^[0-9]{10}$/.test(phoneNumber.trim())) {
      errors.phoneNumber = "Phone number must be exactly 10 digits (no special characters or spaces)";
    }

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
      const response = await authApi.register({
        name: name.trim(),
        email,
        password,
        role,
        department,
        designation,
        phoneNumber,
      });
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

  const strength = getPasswordStrength();

  if (backendDown) {
    return <BackendDownBanner />;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <ErrorBanner message={error} />}
      <div>
        <label
          htmlFor="register-name"
          className="mb-1.5 block text-sm font-medium text-gray-700"
        >
          Full Name <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <Employee className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            id="register-name"
            type="text"
            value={name}
            onChange={(e) => {
              const val = e.target.value;
              setName(val);
              if (!val.trim()) {
                setFieldErrors((p) => ({ ...p, name: "Name is required" }));
              } else if (!/^[A-Za-z0-9\s]+$/.test(val.trim())) {
                setFieldErrors((p) => ({ ...p, name: "Name must contain only alphabets, digits, and spaces" }));
              } else {
                setFieldErrors((p) => ({ ...p, name: "" }));
              }
            }}
            placeholder="John Doe"
            className={`w-full rounded-lg border bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 ${fieldErrors.name ? "border-red-300" : "border-gray-300"}`}
          />
        </div>
        {fieldErrors.name && (
          <p className="mt-1 text-xs text-red-650 font-semibold">❌ {fieldErrors.name}</p>
        )}
      </div>

      <div>
        <label
          htmlFor="register-email"
          className="mb-1.5 block text-sm font-medium text-gray-700"
        >
          Email <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            id="register-email"
            type="email"
            value={email}
            onChange={(e) => {
              const val = e.target.value;
              setEmail(val);
              const err = verifyEmailFormat(val);
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

      <div>
        <label
          htmlFor="register-department"
          className="mb-1.5 block text-sm font-medium text-gray-700"
        >
          Department
        </label>
        <input
          id="register-department"
          type="text"
          value={department}
          onChange={(e) => {
            setDepartment(e.target.value);
            setFieldErrors((p) => ({ ...p, department: "" }));
          }}
          placeholder="e.g. Engineering, Sales"
          className={`w-full rounded-lg border bg-white py-2.5 px-3 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 ${fieldErrors.department ? "border-red-300" : "border-gray-300"}`}
        />
        {fieldErrors.department && (
          <p className="mt-1 text-xs text-red-650 font-semibold">❌ {fieldErrors.department}</p>
        )}
      </div>

      <div>
        <label
          htmlFor="register-designation"
          className="mb-1.5 block text-sm font-medium text-gray-700"
        >
          Designation
        </label>
        <input
          id="register-designation"
          type="text"
          value={designation}
          onChange={(e) => {
            setDesignation(e.target.value);
            setFieldErrors((p) => ({ ...p, designation: "" }));
          }}
          placeholder="e.g. Software Engineer, Manager"
          className={`w-full rounded-lg border bg-white py-2.5 px-3 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 ${fieldErrors.designation ? "border-red-300" : "border-gray-300"}`}
        />
        {fieldErrors.designation && (
          <p className="mt-1 text-xs text-red-650 font-semibold">❌ {fieldErrors.designation}</p>
        )}
      </div>

      <div>
        <label
          htmlFor="register-phone"
          className="mb-1.5 block text-sm font-medium text-gray-700"
        >
          Phone Number
        </label>
        <input
          id="register-phone"
          type="text"
          value={phoneNumber}
          onChange={(e) => {
            const val = e.target.value;
            setPhoneNumber(val);
            if (!val.trim()) {
              setFieldErrors((p) => ({ ...p, phoneNumber: "Phone number is required" }));
            } else if (!/^[0-9]*$/.test(val)) {
              setFieldErrors((p) => ({ ...p, phoneNumber: "Phone number must contain only digits (no spaces or symbols)" }));
            } else if (val.length !== 10) {
              setFieldErrors((p) => ({ ...p, phoneNumber: "Phone number must be exactly 10 digits" }));
            } else {
              setFieldErrors((p) => ({ ...p, phoneNumber: "" }));
            }
          }}
          placeholder="e.g. 9876543210"
          className={`w-full rounded-lg border bg-white py-2.5 px-3 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 ${fieldErrors.phoneNumber ? "border-red-300" : "border-gray-300"}`}
        />
        {fieldErrors.phoneNumber && (
          <p className="mt-1 text-xs text-red-650 font-semibold">❌ {fieldErrors.phoneNumber}</p>
        )}
      </div>      <div>
        <label
          htmlFor="register-password"
          className="mb-1.5 block text-sm font-medium text-gray-700"
        >
          Password <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            id="register-password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setFieldErrors((p) => ({ ...p, password: "" }));
            }}
            placeholder="Min. 8 characters"
            className={`w-full rounded-lg border bg-white py-2.5 pl-10 pr-10 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 ${fieldErrors.password ? "border-red-300" : "border-gray-300"}`}
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
        {password && (
          <div className="mt-2">
            <div className="flex gap-1">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className={`h-1 flex-1 rounded-full transition-colors ${i <= strength.level ? strength.color : "bg-gray-200"}`}
                />
              ))}
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Password strength: {strength.label}
            </p>
          </div>
        )}
      </div>

      <div>
        <label
          htmlFor="register-confirm"
          className="mb-1.5 block text-sm font-medium text-gray-700"
        >
          Confirm Password <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            id="register-confirm"
            type={showPassword ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              setFieldErrors((p) => ({ ...p, confirmPassword: "" }));
            }}
            onBlur={() => {
              if (password !== confirmPassword)
                setFieldErrors((p) => ({
                  ...p,
                  confirmPassword: "Passwords do not match",
                }));
            }}
            placeholder="Re-enter your password"
            className={`w-full rounded-lg border bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 ${fieldErrors.confirmPassword ? "border-red-300" : "border-gray-300"}`}
          />
        </div>
        {fieldErrors.confirmPassword && (
          <p className="mt-1 text-xs text-red-650 font-semibold">
            ❌ {fieldErrors.confirmPassword}
          </p>
        )}
      </div>
      <button
        type="submit"
        disabled={loading}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-teal-800 active:scale-[0.98] disabled:opacity-50"
      >
        {loading ? <LoadingSpinner size="sm" /> : null}
        {loading ? "Creating account..." : "Create Account"}
      </button>
    </form>
  );
}
