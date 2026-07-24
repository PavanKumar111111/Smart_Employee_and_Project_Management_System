import { useState, useEffect, useRef } from "react";
import { AppShell } from "../components/layout/AppShell";
import { useAuth } from "../hooks/useAuth";
import api from "../api/axios";
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  X,
  Filter,
} from "lucide-react";
import toast from "react-hot-toast";

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

const SkeletonCards = () => (
  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
    {[1, 2, 3, 4, 5, 6].map((i) => (
      <div
        key={i}
        className="animate-pulse rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-full bg-gray-200" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-1/2 rounded bg-gray-200" />
            <div className="h-3 w-1/3 rounded bg-gray-200" />
          </div>
        </div>
        <div className="space-y-2 mb-4">
          <div className="h-3 w-full rounded bg-gray-200" />
          <div className="h-3 w-5/6 rounded bg-gray-200" />
        </div>
        <div className="flex justify-between items-center border-t border-gray-100 pt-3">
          <div className="h-3 w-1/4 rounded bg-gray-200" />
          <div className="h-5 w-16 rounded-full bg-gray-200" />
        </div>
      </div>
    ))}
  </div>
);

export function EmployeeDirectoryPage() {
  const { employee: currentUser, login } = useAuth();
  const isAdmin = currentUser?.role === "ADMIN";

  const [loading, setLoading] = useState(true);
  const [pageData, setPageData] = useState(null);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [searchField, setSearchField] = useState("all");
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [sortBy, setSortBy] = useState("name");
  const [sortDir, setSortDir] = useState("asc");
  const filterRef = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (filterRef.current && !filterRef.current.contains(e.target)) {
        setShowFilterDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Modals state
  const [showModal, setShowModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);

  // Form inputs
  const [name, setName] = useState("");
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [department, setDepartment] = useState("");
  const [designation, setDesignation] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/employees", {
        params: { page, size: 25, sortBy, sortDir, search },
      });
      let data = res.data;
      if (search.trim() && searchField !== "all") {
        const term = search.toLowerCase();
        data.content = data.content.filter((emp) => {
          if (searchField === "name")
            return emp.name?.toLowerCase().includes(term);
          if (searchField === "email")
            return emp.email?.toLowerCase().includes(term);
          if (searchField === "department")
            return emp.department?.toLowerCase().includes(term);
          return false;
        });
      }
      setPageData(data);
    } catch (err) {
      console.error("Error fetching employees", err);
      toast.error("Failed to load employees");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [page, sortBy, sortDir]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(0);
    fetchEmployees();
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortDir("asc");
    }
  };

  const handleOpenCreateModal = () => {
    setEditingEmployee(null);
    setName("");
    setProfilePhoto(null);
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setDepartment("");
    setDesignation("");
    setPhoneNumber("");
    setFieldErrors({});
    setShowModal(true);
  };

  const handleOpenEditModal = (emp) => {
    setEditingEmployee(emp);
    setName(emp.name);
    setProfilePhoto(null);
    setEmail(emp.email);
    setPassword("");
    setConfirmPassword("");
    setDepartment(emp.department || "");
    setDesignation(emp.designation || "");
    setPhoneNumber(emp.phoneNumber || "");
    setFieldErrors({});
    setShowModal(true);
  };

  const validate = () => {
    const errors = {};
    if (!name.trim()) {
      errors.name = "Full Name is required";
    } else if (!/^[A-Za-z0-9\s]+$/.test(name.trim())) {
      errors.name = "Full Name must contain only alphabets, digits, and spaces";
    }
    
    const emailErr = verifyEmailFormat(email);
    if (emailErr) {
      errors.email = emailErr;
    }

    if (!editingEmployee) {
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
    } else {
      if (password) {
        if (password.length < 8) {
          errors.password = "Password must be at least 8 characters";
        }
        if (!confirmPassword) {
          errors.confirmPassword = "Please confirm your password";
        } else if (password !== confirmPassword) {
          errors.confirmPassword = "Passwords do not match";
        }
      }
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

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveEmployee = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      if (editingEmployee) {
        // Update
        await api.put(`/admin/employees/${editingEmployee.id}`, {
          name: name.trim(),
          email: email.trim(),
          password,
          department: department.trim(),
          designation: designation.trim(),
          phoneNumber: phoneNumber.trim(),
        });
        toast.success("Employee updated successfully");
      } else {
        // Create
        const formData = new FormData();
        formData.append("name", name.trim());
        formData.append("email", email.trim());
        formData.append("password", password);
        formData.append("department", department.trim());
        formData.append("designation", designation.trim());
        formData.append("phoneNumber", phoneNumber.trim());
        formData.append("role", "EMPLOYEE");
        if (profilePhoto) {
          formData.append("file", profilePhoto);
        }

        await api.post("/admin/employees", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
        toast.success("Employee created successfully");
      }
      setShowModal(false);
      fetchEmployees();
    } catch (err) {
      console.error("Error saving employee", err);
      toast.error(err.response?.data?.message || "Failed to save employee");
    }
  };

  const handleImpersonate = async (emp) => {
    try {
      const adminToken = localStorage.getItem("token");
      if (adminToken) {
        sessionStorage.setItem("adminToken", adminToken);
        sessionStorage.setItem("adminUser", JSON.stringify(currentUser));
      }

      const res = await api.post(`/admin/employees/${emp.id}/impersonate`);
      login(res.data);
      toast.success(`Logged in as ${emp.name}`);
      window.location.href = "/dashboard";
    } catch (err) {
      console.error("Error during impersonation", err);
      const msg =
        err.response?.data?.message || "Failed to impersonate employee";
      toast.error(msg);
    }
  };

  const handleDeleteEmployee = async (id) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this employee? This action is permanent.",
      )
    ) {
      return;
    }

    try {
      await api.delete(`/admin/employees/${id}`);
      toast.success("Employee deleted successfully");
      fetchEmployees();
    } catch (err) {
      console.error("Error deleting employee", err);
      toast.error("Failed to delete employee");
    }
  };

  return (
    <AppShell>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Employee Directory
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            View and manage employee database, assign roles, and set
            departments.
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={handleOpenCreateModal}
            className="swiss-btn flex h-10 px-3 items-center justify-center gap-1.5 shadow-sm"
          >
            <Plus className="h-4.5 w-4.5" />
            Add Employee
          </button>
        )}
      </div>

      {/* Search and Filters */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <form
          onSubmit={handleSearchSubmit}
          className="relative flex-1 max-w-md"
        >
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder={`Search employee by ${searchField === "all" ? "keyword" : searchField}...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="swiss-input w-full bg-white py-2 pl-9 pr-4 text-sm outline-none"
          />
        </form>

        {/* Consolidated Filter Symbol dropdown */}
        <div className="relative" ref={filterRef}>
          <button
            onClick={() => setShowFilterDropdown(!showFilterDropdown)}
            className="swiss-btn flex h-10 px-3 items-center justify-center gap-1.5 shadow-sm"
            title="Filters"
          >
            <Filter className="h-4 w-4" />
            <span className="text-sm font-semibold">Filter</span>
          </button>
          {showFilterDropdown && (
            <div className="glass-card absolute right-0 mt-1 z-20 w-56 py-2 shadow-lg text-sm text-gray-700 dark:text-gray-200">
              <div className="px-3 py-1 text-xs font-bold uppercase tracking-wider text-gray-400">
                Search Basis
              </div>
              <button
                onClick={() => {
                  setSearchField("name");
                  setShowFilterDropdown(false);
                }}
                className={`flex w-full items-center px-3 py-1.5 hover:bg-gray-50 ${searchField === "name" ? "font-bold text-teal-700" : ""}`}
              >
                👤 Based on Names
              </button>
              <button
                onClick={() => {
                  setSearchField("department");
                  setShowFilterDropdown(false);
                }}
                className={`flex w-full items-center px-3 py-1.5 hover:bg-gray-50 ${searchField === "department" ? "font-bold text-teal-700" : ""}`}
              >
                🏢 Based on Departments
              </button>
              <button
                onClick={() => {
                  setSearchField("email");
                  setShowFilterDropdown(false);
                }}
                className={`flex w-full items-center px-3 py-1.5 hover:bg-gray-50 ${searchField === "email" ? "font-bold text-teal-700" : ""}`}
              >
                ✉️ Based on Emails
              </button>
              <div className="my-1 border-t border-gray-100" />
              <button
                onClick={() => {
                  setSearchField("all");
                  setSearch("");
                  setShowFilterDropdown(false);
                }}
                className="flex w-full items-center px-3 py-1.5 text-red-600 hover:bg-red-50"
              >
                🔄 Reset All Filters
              </button>
            </div>
          )}
        </div>
        <button
          onClick={() => {
            setPage(0);
            fetchEmployees();
          }}
          className="swiss-btn px-4 py-2 text-sm shadow-sm"
        >
          Search
        </button>
      </div>

      {/* Employees List */}
      {loading ? (
        <SkeletonCards />
      ) : (
        <div className="glass-card shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-500">
              <thead className="bg-gray-50 text-xs uppercase text-gray-700">
                <tr>
                  <th
                    className="px-6 py-4 cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort("name")}
                  >
                    <div className="flex items-center gap-1">
                      Name
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th
                    className="px-6 py-4 cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort("email")}
                  >
                    <div className="flex items-center gap-1">
                      Email
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th className="px-6 py-4">Department</th>
                  <th className="px-6 py-4">Designation</th>
                  <th className="px-6 py-4">Phone</th>
                  <th className="px-6 py-4">Status</th>
                  {isAdmin && <th className="px-6 py-4 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pageData?.content?.map((emp) => (
                  <tr key={emp.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-6 py-4 font-semibold text-gray-900">
                      <div className="flex items-center gap-2.5">
                        {emp.profilePictureUrl ? (
                          <img
                            src={emp.profilePictureUrl}
                            alt=""
                            className="h-8 w-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-100 text-xs font-bold text-teal-700">
                            {emp.name
                              ?.split(" ")
                              .map((n) => n?.[0] || "")
                              .join("")
                              .slice(0, 2)
                              .toUpperCase() || "?"}
                          </div>
                        )}
                        {emp.name}
                      </div>
                    </td>
                    <td className="px-6 py-4">{emp.email}</td>
                    <td className="px-6 py-4">{emp.department || "N/A"}</td>
                    <td className="px-6 py-4">{emp.designation || "N/A"}</td>
                    <td className="px-6 py-4">{emp.phoneNumber || "N/A"}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${emp.status === "ACTIVE" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
                      >
                        {emp.status}
                      </span>
                    </td>
                    {isAdmin && (
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2 items-center">
                          <button
                            onClick={() => handleImpersonate(emp)}
                            className="rounded bg-teal-50 px-2.5 py-1 text-xs font-bold text-teal-700 hover:bg-teal-150 transition-colors"
                            title="Login as this employee"
                          >
                            Login As
                          </button>
                          <button
                            onClick={() => handleOpenEditModal(emp)}
                            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-50 hover:text-gray-600"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteEmployee(emp.id)}
                            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-50 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
                {pageData?.content?.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-gray-400">
                      No employees found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pageData && pageData.totalPages >= 1 && (
            <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50 px-6 py-4">
              <span className="text-sm text-gray-500">
                Showing page{" "}
                <span className="font-semibold text-gray-900">
                  {pageData.number + 1}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-gray-900">
                  {pageData.totalPages}
                </span>
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="swiss-btn p-1.5 disabled:opacity-50"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={() =>
                    setPage((p) => Math.min(pageData.totalPages - 1, p + 1))
                  }
                  disabled={page === pageData.totalPages - 1}
                  className="swiss-btn p-1.5 disabled:opacity-50"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create/Update Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl border border-gray-200">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">
                {editingEmployee ? "Edit Employee Info" : "Add New Employee"}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSaveEmployee} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-700">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => {
                    const val = e.target.value;
                    setName(val);
                    if (!val.trim()) {
                      setFieldErrors((p) => ({ ...p, name: "Full Name is required" }));
                    } else if (!/^[A-Za-z0-9\s]+$/.test(val.trim())) {
                      setFieldErrors((p) => ({ ...p, name: "Username must contain only alphabets and digits" }));
                    } else {
                      setFieldErrors((p) => ({ ...p, name: "" }));
                    }
                  }}
                  placeholder="Jane Doe"
                  className={`w-full rounded-lg border py-2 px-3 text-sm outline-none focus:border-teal-500 ${fieldErrors.name ? "border-red-300" : "border-gray-300"}`}
                />
                {fieldErrors.name && (
                  <p className="mt-1 text-xs text-red-650 font-semibold">❌ {fieldErrors.name}</p>
                )}
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-700">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    const val = e.target.value;
                    setEmail(val);
                    const err = verifyEmailFormat(val);
                    setFieldErrors((p) => ({ ...p, email: err }));
                  }}
                  placeholder="jane.doe@company.com"
                  className={`w-full rounded-lg border py-2 px-3 text-sm outline-none focus:border-teal-500 ${fieldErrors.email ? "border-red-300" : "border-gray-300"}`}
                />
                {fieldErrors.email && (
                  <p className="mt-1 text-xs text-red-650 font-semibold">❌ {fieldErrors.email}</p>
                )}
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-700">
                  Department
                </label>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => {
                    setDepartment(e.target.value);
                    setFieldErrors((p) => ({ ...p, department: "" }));
                  }}
                  placeholder="Engineering"
                  className={`w-full rounded-lg border py-2 px-3 text-sm outline-none focus:border-teal-500 ${fieldErrors.department ? "border-red-300" : "border-gray-300"}`}
                />
                {fieldErrors.department && (
                  <p className="mt-1 text-xs text-red-650 font-semibold">❌ {fieldErrors.department}</p>
                )}
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-700">
                  Designation
                </label>
                <input
                  type="text"
                  value={designation}
                  onChange={(e) => {
                    setDesignation(e.target.value);
                    setFieldErrors((p) => ({ ...p, designation: "" }));
                  }}
                  placeholder="React Developer"
                  className={`w-full rounded-lg border py-2 px-3 text-sm outline-none focus:border-teal-500 ${fieldErrors.designation ? "border-red-300" : "border-gray-300"}`}
                />
                {fieldErrors.designation && (
                  <p className="mt-1 text-xs text-red-650 font-semibold">❌ {fieldErrors.designation}</p>
                )}
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-700">
                  Phone Number
                </label>
                <input
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
                  className={`w-full rounded-lg border py-2 px-3 text-sm outline-none focus:border-teal-500 ${fieldErrors.phoneNumber ? "border-red-300" : "border-gray-300"}`}
                />
                {fieldErrors.phoneNumber && (
                  <p className="mt-1 text-xs text-red-650 font-semibold">❌ {fieldErrors.phoneNumber}</p>
                )}
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-700">
                  Password {!editingEmployee && <span className="text-red-500">*</span>}{" "}
                  {editingEmployee && (
                    <span className="text-xs text-gray-400 font-normal">
                      (Leave blank to keep current)
                    </span>
                  )}
                </label>
                <input
                  type="password"
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
                  placeholder={
                    editingEmployee ? "••••••••" : "Password (min. 8 chars)"
                  }
                  className={`w-full rounded-lg border py-2 px-3 text-sm outline-none focus:border-teal-500 ${fieldErrors.password ? "border-red-300" : "border-gray-300"}`}
                />
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
                <label className="mb-1 block text-sm font-semibold text-gray-700">
                  Confirm Password {!editingEmployee && <span className="text-red-500">*</span>}
                </label>
                <input
                  type="password"
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
                  placeholder="Re-enter password"
                  className={`w-full rounded-lg border py-2 px-3 text-sm outline-none focus:border-teal-500 ${fieldErrors.confirmPassword ? "border-red-300" : "border-gray-300"}`}
                />
                {fieldErrors.confirmPassword && (
                  <p className="mt-1 text-xs text-red-650 font-semibold">❌ {fieldErrors.confirmPassword}</p>
                )}
              </div>              {!editingEmployee && (
                <div>
                  <label className="mb-1 block text-sm font-semibold text-gray-700">
                    Profile Photo (Optional)
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setProfilePhoto(e.target.files[0]);
                      }
                    }}
                    className="w-full rounded-lg border py-2 px-3 text-sm outline-none focus:border-teal-500 bg-white"
                  />
                </div>
              )}
              <div className="mt-6 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-teal-800"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}
