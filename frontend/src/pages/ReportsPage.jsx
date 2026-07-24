import { useState, useEffect, useRef } from "react";
import { AppShell } from "../components/layout/AppShell";
import api from "../api/axios";
import { Download, Filter } from "lucide-react";
import toast from "react-hot-toast";

const SkeletonCards = () => (
  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
    {[1, 2, 3].map((i) => (
      <div
        key={i}
        className="animate-pulse rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
      >
        <div className="h-4 w-1/3 rounded bg-gray-200 mb-4" />
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

export function ReportsPage() {
  const [activeTab, setActiveTab] = useState("employees");
  const [loading, setLoading] = useState(true);
  const [employeesReport, setEmployeesReport] = useState([]);
  const [projectsReport, setProjectsReport] = useState([]);
  const [pendingReport, setPendingReport] = useState([]);
  const [downloading, setDownloading] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchField, setSearchField] = useState("all");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  // Page state for pagination
  const [employeesPage, setEmployeesPage] = useState(1);
  const [projectsPage, setProjectsPage] = useState(1);
  const [pendingPage, setPendingPage] = useState(1);
  const itemsPerPage = 5;

  const menuRef = useRef(null);
  const filterRef = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowExportMenu(false);
      }
      if (filterRef.current && !filterRef.current.contains(e.target)) {
        setShowFilterDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const filteredEmployees = employeesReport.filter((emp) => {
    let matchesQuery = true;
    if (searchQuery.trim()) {
      const term = searchQuery.toLowerCase();
      if (searchField === "name")
        matchesQuery = emp.name?.toLowerCase().includes(term);
      else if (searchField === "email")
        matchesQuery = emp.email?.toLowerCase().includes(term);
      else if (searchField === "department")
        matchesQuery = emp.department?.toLowerCase().includes(term);
      else {
        matchesQuery =
          emp.name?.toLowerCase().includes(term) ||
          emp.email?.toLowerCase().includes(term) ||
          emp.department?.toLowerCase().includes(term);
      }
    }
    return matchesQuery;
  });

  const filteredProjects = projectsReport.filter((proj) => {
    let matchesQuery = true;
    if (searchQuery.trim()) {
      const term = searchQuery.toLowerCase();
      if (searchField === "name" || searchField === "project_name")
        matchesQuery = proj.name?.toLowerCase().includes(term);
      else if (searchField === "email")
        matchesQuery = proj.ownerName?.toLowerCase().includes(term);
      else if (searchField === "department")
        matchesQuery = proj.key?.toLowerCase().includes(term);
      else {
        matchesQuery =
          proj.name?.toLowerCase().includes(term) ||
          proj.key?.toLowerCase().includes(term) ||
          proj.ownerName?.toLowerCase().includes(term);
      }
    }
    const matchesStatus =
      statusFilter === "ALL" || proj.status === statusFilter;
    const matchesPriority =
      priorityFilter === "ALL" || proj.priority === priorityFilter;
    return matchesQuery && matchesStatus && matchesPriority;
  });

  const filteredPending = pendingReport.filter((task) => {
    let matchesQuery = true;
    if (searchQuery.trim()) {
      const term = searchQuery.toLowerCase();
      if (searchField === "name")
        matchesQuery = task.title?.toLowerCase().includes(term);
      else if (searchField === "email")
        matchesQuery = task.assigneeName?.toLowerCase().includes(term);
      else if (searchField === "department" || searchField === "project_name")
        matchesQuery = task.projectName?.toLowerCase().includes(term);
      else {
        matchesQuery =
          task.title?.toLowerCase().includes(term) ||
          task.issueKey?.toLowerCase().includes(term) ||
          task.assigneeName?.toLowerCase().includes(term) ||
          task.projectName?.toLowerCase().includes(term);
      }
    }
    const matchesStatus =
      statusFilter === "ALL" || task.status === statusFilter;
    const matchesPriority =
      priorityFilter === "ALL" || task.priority === priorityFilter;
    return matchesQuery && matchesStatus && matchesPriority;
  });

  const currentEmployees = filteredEmployees.slice(
    (employeesPage - 1) * itemsPerPage,
    employeesPage * itemsPerPage,
  );
  const currentProjects = filteredProjects.slice(
    (projectsPage - 1) * itemsPerPage,
    projectsPage * itemsPerPage,
  );
  const currentPending = filteredPending.slice(
    (pendingPage - 1) * itemsPerPage,
    pendingPage * itemsPerPage,
  );

  const totalEmployeesPages = Math.ceil(
    filteredEmployees.length / itemsPerPage,
  );
  const totalProjectsPages = Math.ceil(filteredProjects.length / itemsPerPage);
  const totalPendingPages = Math.ceil(filteredPending.length / itemsPerPage);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === "employees") {
        const res = await api.get("/reports/tasks/employee-wise");
        setEmployeesReport(res.data);
      } else if (activeTab === "projects") {
        const res = await api.get("/reports/projects/progress");
        setProjectsReport(res.data);
      } else {
        const res = await api.get("/reports/tasks/pending");
        setPendingReport(res.data);
      }
    } catch (err) {
      console.error("Error fetching report details", err);
      toast.error("Failed to load report data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const handleDownload = async (format) => {
    const downloadKey = `${activeTab}_${format}`;
    setDownloading(downloadKey);
    try {
      const urlPath =
        format === "csv" ? "/reports/export/csv" : `/reports/export/${format}`;
      const res = await api.get(urlPath, {
        params: { reportType: activeTab },
        responseType: "blob",
      });

      // Trigger file download in browser
      const blob = new Blob([res.data]);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      let extension = "xlsx";
      if (format === "pdf") extension = "pdf";
      if (format === "csv") extension = "csv";
      a.download = `${activeTab}_report.${extension}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success(`Downloaded ${format.toUpperCase()} report!`);
    } catch (err) {
      console.error("Error downloading report", err);
      toast.error("Failed to download report");
    } finally {
      setDownloading(null);
      setShowExportMenu(false);
    }
  };

  return (
    <AppShell>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">System Reports</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Generate, analyze, and export task reports, project metrics, and
            pending works.
          </p>
        </div>
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setShowExportMenu(!showExportMenu)}
            disabled={loading || downloading !== null}
            className="swiss-btn flex h-10 px-3 items-center justify-center gap-1.5 shadow-sm disabled:opacity-50"
          >
            <Download className="h-4 w-4 text-white" />
            Export Report
          </button>
          {showExportMenu && (
            <div className="glass-card absolute right-0 top-full z-10 mt-1 w-44 py-1 shadow-lg">
              <button
                onClick={() => handleDownload("pdf")}
                className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                📄 Download PDF
              </button>
              <button
                onClick={() => handleDownload("excel")}
                className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                📊 Download Excel
              </button>
              <button
                onClick={() => handleDownload("csv")}
                className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                📝 Download CSV
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => {
            setActiveTab("employees");
            setSearchQuery("");
          }}
          className={`border-b-2 px-5 py-2.5 text-sm font-semibold transition-colors ${activeTab === "employees" ? "border-teal-700 text-teal-700 dark:text-teal-400" : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400"}`}
        >
          Employee Task Report
        </button>
        <button
          onClick={() => {
            setActiveTab("projects");
            setSearchQuery("");
          }}
          className={`border-b-2 px-5 py-2.5 text-sm font-semibold transition-colors ${activeTab === "projects" ? "border-teal-700 text-teal-700 dark:text-teal-400" : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400"}`}
        >
          Project Progress Report
        </button>
        <button
          onClick={() => {
            setActiveTab("pending");
            setSearchQuery("");
          }}
          className={`border-b-2 px-5 py-2.5 text-sm font-semibold transition-colors ${activeTab === "pending" ? "border-teal-700 text-teal-700 dark:text-teal-400" : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400"}`}
        >
          Pending Tasks Report
        </button>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <span className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400">
            🔍
          </span>
          <input
            type="text"
            placeholder={`Search report by ${searchField === "all" ? "keyword" : searchField}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="swiss-input w-full bg-white py-2 pl-9 pr-4 text-sm outline-none"
          />
        </div>

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
                  setSearchField("project_name");
                  setShowFilterDropdown(false);
                }}
                className={`flex w-full items-center px-3 py-1.5 hover:bg-gray-50 ${searchField === "project_name" ? "font-bold text-teal-700" : ""}`}
              >
                📁 Based on Project Names
              </button>

              <div className="my-1 border-t border-gray-100" />
              <div className="px-3 py-1 text-xs font-bold uppercase tracking-wider text-gray-400">
                Filter Status
              </div>
              {["ALL", "PLANNED", "IN_PROGRESS", "COMPLETED", "ON_HOLD"].map(
                (st) => (
                  <button
                    key={st}
                    onClick={() => {
                      setStatusFilter(st);
                      setShowFilterDropdown(false);
                    }}
                    className={`flex w-full items-center px-3 py-1.5 hover:bg-gray-50 ${statusFilter === st ? "font-bold text-teal-700" : ""}`}
                  >
                    🟢 {st.replace("_", " ")}
                  </button>
                ),
              )}

              <div className="my-1 border-t border-gray-100" />
              <div className="px-3 py-1 text-xs font-bold uppercase tracking-wider text-gray-400">
                Filter Priority
              </div>
              {["ALL", "HIGH", "MEDIUM", "LOW"].map((pr) => (
                <button
                  key={pr}
                  onClick={() => {
                    setPriorityFilter(pr);
                    setShowFilterDropdown(false);
                  }}
                  className={`flex w-full items-center px-3 py-1.5 hover:bg-gray-50 ${priorityFilter === pr ? "font-bold text-teal-700" : ""}`}
                >
                  ⚡ {pr}
                </button>
              ))}

              <div className="my-1 border-t border-gray-100" />
              <button
                onClick={() => {
                  setSearchField("all");
                  setStatusFilter("ALL");
                  setPriorityFilter("ALL");
                  setSearchQuery("");
                  setShowFilterDropdown(false);
                }}
                className="flex w-full items-center px-3 py-1.5 text-red-600 hover:bg-red-50"
              >
                🔄 Reset All Filters
              </button>
            </div>
          )}
        </div>
      </div>

      {/* List report content */}
      {loading ? (
        <SkeletonCards />
      ) : (
        <div className="glass-card shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            {activeTab === "employees" && (
              <>
                <table className="w-full text-left text-sm text-gray-500">
                  <thead className="bg-gray-50 text-xs uppercase text-gray-700">
                    <tr>
                      <th className="px-6 py-4">Employee Name</th>
                      <th className="px-6 py-4">Email</th>
                      <th className="px-6 py-4">Department</th>
                      <th className="px-6 py-4 text-center">Assigned Tasks</th>
                      <th className="px-6 py-4 text-center text-green-700">
                        Completed
                      </th>
                      <th className="px-6 py-4 text-center text-blue-700">
                        In Progress
                      </th>
                      <th className="px-6 py-4 text-center text-yellow-700">
                        Pending
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {currentEmployees.map((emp) => (
                      <tr key={emp.id} className="hover:bg-gray-50">
                        <td className="whitespace-nowrap px-6 py-4 font-semibold text-gray-900">
                          {emp.name}
                        </td>
                        <td className="px-6 py-4">{emp.email}</td>
                        <td className="px-6 py-4">{emp.department}</td>
                        <td className="px-6 py-4 text-center font-bold">
                          {emp.totalTasks}
                        </td>
                        <td className="px-6 py-4 text-center font-semibold text-green-600">
                          {emp.completedTasks}
                        </td>
                        <td className="px-6 py-4 text-center font-semibold text-blue-600">
                          {emp.inProgressTasks}
                        </td>
                        <td className="px-6 py-4 text-center font-semibold text-yellow-600">
                          {emp.pendingTasks}
                        </td>
                      </tr>
                    ))}
                    {currentEmployees.length === 0 && (
                      <tr>
                        <td
                          colSpan={7}
                          className="py-8 text-center text-gray-400"
                        >
                          No matching employee task stats found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
                {totalEmployeesPages > 1 && (
                  <div className="flex items-center justify-center gap-1 py-3 border-t border-gray-100">
                    <button
                      onClick={() =>
                        setEmployeesPage((p) => Math.max(p - 1, 1))
                      }
                      disabled={employeesPage === 1}
                      className="swiss-btn px-2.5 py-1 text-xs disabled:opacity-50"
                    >
                      Prev
                    </button>
                    {Array.from({ length: totalEmployeesPages }).map(
                      (_, idx) => (
                        <button
                          key={idx}
                          onClick={() => setEmployeesPage(idx + 1)}
                          className={`px-2.5 py-1 text-xs font-bold ${
                            employeesPage === idx + 1
                              ? "swiss-btn text-white"
                              : "swiss-btn bg-white text-gray-700"
                          }`}
                          style={
                            employeesPage === idx + 1
                              ? { backgroundColor: "#0f766e", color: "#ffffff" }
                              : undefined
                          }
                        >
                          {idx + 1}
                        </button>
                      ),
                    )}
                    <button
                      onClick={() =>
                        setEmployeesPage((p) =>
                          Math.min(p + 1, totalEmployeesPages),
                        )
                      }
                      disabled={employeesPage === totalEmployeesPages}
                      className="swiss-btn px-2.5 py-1 text-xs disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}

            {activeTab === "projects" && (
              <>
                <table className="w-full text-left text-sm text-gray-500">
                  <thead className="bg-gray-50 text-xs uppercase text-gray-700">
                    <tr>
                      <th className="px-6 py-4">Key</th>
                      <th className="px-6 py-4">Project Name</th>
                      <th className="px-6 py-4">Owner</th>
                      <th className="px-6 py-4 text-center">Members</th>
                      <th className="px-6 py-4 text-center">Status</th>
                      <th className="px-6 py-4 text-center">Deadline</th>
                      <th className="px-6 py-4 text-right">Avg Progress</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {currentProjects.map((proj) => (
                      <tr key={proj.id} className="hover:bg-gray-50">
                        <td className="whitespace-nowrap px-6 py-4 font-mono font-bold text-teal-700 text-xs">
                          {proj.key}
                        </td>
                        <td className="px-6 py-4 font-semibold text-gray-900">
                          {proj.name}
                        </td>
                        <td className="px-6 py-4">{proj.ownerName}</td>
                        <td className="px-6 py-4 text-center">
                          {proj.membersCount}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="rounded bg-teal-50 px-2 py-0.5 text-xs font-semibold text-teal-700">
                            {proj.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          {proj.deadline}
                        </td>
                        <td className="px-6 py-4 text-right font-bold text-teal-600">
                          {proj.avgProgress}%
                        </td>
                      </tr>
                    ))}
                    {currentProjects.length === 0 && (
                      <tr>
                        <td
                          colSpan={7}
                          className="py-8 text-center text-gray-400"
                        >
                          No matching projects progress stats found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
                {totalProjectsPages > 1 && (
                  <div className="flex items-center justify-center gap-1 py-3 border-t border-gray-100">
                    <button
                      onClick={() => setProjectsPage((p) => Math.max(p - 1, 1))}
                      disabled={projectsPage === 1}
                      className="swiss-btn px-2.5 py-1 text-xs disabled:opacity-50"
                    >
                      Prev
                    </button>
                    {Array.from({ length: totalProjectsPages }).map(
                      (_, idx) => (
                        <button
                          key={idx}
                          onClick={() => setProjectsPage(idx + 1)}
                          className={`px-2.5 py-1 text-xs font-bold ${
                            projectsPage === idx + 1
                              ? "swiss-btn text-white"
                              : "swiss-btn bg-white text-gray-700"
                          }`}
                          style={
                            projectsPage === idx + 1
                              ? { backgroundColor: "#0f766e", color: "#ffffff" }
                              : undefined
                          }
                        >
                          {idx + 1}
                        </button>
                      ),
                    )}
                    <button
                      onClick={() =>
                        setProjectsPage((p) =>
                          Math.min(p + 1, totalProjectsPages),
                        )
                      }
                      disabled={projectsPage === totalProjectsPages}
                      className="swiss-btn px-2.5 py-1 text-xs disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}

            {activeTab === "pending" && (
              <>
                <table className="w-full text-left text-sm text-gray-500">
                  <thead className="bg-gray-50 text-xs uppercase text-gray-700">
                    <tr>
                      <th className="px-6 py-4">Task ID</th>
                      <th className="px-6 py-4">Project</th>
                      <th className="px-6 py-4">Title</th>
                      <th className="px-6 py-4">Assignee</th>
                      <th className="px-6 py-4">Priority</th>
                      <th className="px-6 py-4 text-right">Progress</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {currentPending.map((task) => (
                      <tr key={task.id} className="hover:bg-gray-50">
                        <td className="whitespace-nowrap px-6 py-4 font-mono font-bold text-teal-700 text-xs">
                          {task.issueKey}
                        </td>
                        <td className="px-6 py-4 font-semibold text-gray-900">
                          {task.projectName}
                        </td>
                        <td className="px-6 py-4 font-medium text-gray-700 max-w-[200px] truncate">
                          {task.title}
                        </td>
                        <td className="px-6 py-4 font-semibold text-teal-700">
                          {task.assigneeName}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`rounded px-1.5 py-0.5 text-xs font-bold ${task.priority === "HIGH" ? "bg-red-50 text-red-700" : task.priority === "MEDIUM" ? "bg-yellow-50 text-yellow-700" : "bg-gray-100 text-gray-600"}`}
                          >
                            {task.priority}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right font-bold text-gray-700">
                          {task.progress}%
                        </td>
                      </tr>
                    ))}
                    {currentPending.length === 0 && (
                      <tr>
                        <td
                          colSpan={6}
                          className="py-8 text-center text-gray-400"
                        >
                          No matching pending tasks found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
                {totalPendingPages > 1 && (
                  <div className="flex items-center justify-center gap-1 py-3 border-t border-gray-100">
                    <button
                      onClick={() => setPendingPage((p) => Math.max(p - 1, 1))}
                      disabled={pendingPage === 1}
                      className="swiss-btn px-2.5 py-1 text-xs disabled:opacity-50"
                    >
                      Prev
                    </button>
                    {Array.from({ length: totalPendingPages }).map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setPendingPage(idx + 1)}
                        className={`px-2.5 py-1 text-xs font-bold ${
                          pendingPage === idx + 1
                            ? "swiss-btn text-white"
                            : "swiss-btn bg-white text-gray-700"
                        }`}
                        style={
                          pendingPage === idx + 1
                            ? { backgroundColor: "#0f766e", color: "#ffffff" }
                            : undefined
                        }
                      >
                        {idx + 1}
                      </button>
                    ))}
                    <button
                      onClick={() =>
                        setPendingPage((p) =>
                          Math.min(p + 1, totalPendingPages),
                        )
                      }
                      disabled={pendingPage === totalPendingPages}
                      className="swiss-btn px-2.5 py-1 text-xs disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </AppShell>
  );
}
