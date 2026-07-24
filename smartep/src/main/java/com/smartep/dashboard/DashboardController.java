package com.smartep.dashboard;

import com.smartep.audit.AuditLogService;
import com.smartep.issue.Issue;
import com.smartep.issue.IssueRepository;
import com.smartep.issue.IssueStatus;
import com.smartep.project.Project;
import com.smartep.project.ProjectRepository;
import com.smartep.security.EmployeePrincipal;
import com.smartep.employee.Role;
import com.smartep.employee.Employee;
import com.smartep.employee.EmployeeRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    private final EmployeeRepository userRepository;
    private final ProjectRepository projectRepository;
    private final IssueRepository issueRepository;
    private final AuditLogService auditLogService;

    public DashboardController(EmployeeRepository userRepository, ProjectRepository projectRepository, IssueRepository issueRepository, AuditLogService auditLogService) {
        this.userRepository = userRepository;
        this.projectRepository = projectRepository;
        this.issueRepository = issueRepository;
        this.auditLogService = auditLogService;
    }

    @GetMapping("/admin")
    public ResponseEntity<?> getAdminDashboardStats() {
        Map<String, Object> stats = new HashMap<>();

        // Total employees count
        long totalEmployees = userRepository.findAll().stream()
                .filter(u -> u.getRole() == Role.EMPLOYEE)
                .count();
        stats.put("totalEmployees", totalEmployees);

        // Completed / In Progress projects count
        long completedProjects = projectRepository.findAll().stream()
                .filter(p -> "COMPLETED".equalsIgnoreCase(p.getStatus()))
                .count();
        long inProgressProjects = projectRepository.findAll().stream()
                .filter(p -> !"COMPLETED".equalsIgnoreCase(p.getStatus()))
                .count();
        stats.put("completedProjects", completedProjects);
        stats.put("inProgressProjects", inProgressProjects);

        // Completed tasks count
        long completedTasks = issueRepository.findAll().stream()
                .filter(i -> i.getStatus() == com.smartep.issue.IssueStatus.DONE)
                .count();
        stats.put("completedTasks", completedTasks);

        // Task count by status
        Map<String, Long> tasksByStatus = new HashMap<>();
        for (IssueStatus status : IssueStatus.values()) {
            tasksByStatus.put(status.name(), 0L);
        }
        issueRepository.findAll().forEach(issue -> {
            if ("COMPLETED".equalsIgnoreCase(issue.getProject().getStatus())) {
                tasksByStatus.put("DONE", tasksByStatus.getOrDefault("DONE", 0L) + 1);
            } else {
                String statusName = issue.getStatus().name();
                tasksByStatus.put(statusName, tasksByStatus.getOrDefault(statusName, 0L) + 1);
            }
        });
        stats.put("tasksByStatus", tasksByStatus);

        // Project count by status
        Map<String, Long> projectsByStatus = new HashMap<>();
        projectRepository.findAll().forEach(project -> {
            String status = project.getStatus();
            projectsByStatus.put(status, projectsByStatus.getOrDefault(status, 0L) + 1);
        });
        stats.put("projectsByStatus", projectsByStatus);

        // Recent Audit logs
        stats.put("recentLogs", auditLogService.getRecentLogs());

        return ResponseEntity.ok(stats);
    }

    @GetMapping("/employee")
    public ResponseEntity<?> getEmployeeDashboardStats(@AuthenticationPrincipal EmployeePrincipal userPrincipal) {
        UUID employeeId = userPrincipal.getId();
        Employee employee = userRepository.findById(employeeId).orElse(null);
        if (employee == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Employee not found"));
        }

        Map<String, Object> stats = new HashMap<>();

        // Fetch tasks assigned to the employee
        List<Issue> assignedIssues = issueRepository.findAll().stream()
                .filter(issue -> issue.getAssignee() != null && issue.getAssignee().getId().equals(employeeId))
                .collect(Collectors.toList());

        long totalTasks = assignedIssues.size();
        long completedTasks = assignedIssues.stream().filter(i -> i.getStatus() == IssueStatus.DONE).count();
        long inProgressTasks = assignedIssues.stream().filter(i -> i.getStatus() == IssueStatus.IN_PROGRESS).count();
        long pendingTasks = totalTasks - completedTasks;

        stats.put("totalTasks", totalTasks);
        stats.put("completedTasks", completedTasks);
        stats.put("inProgressTasks", inProgressTasks);
        stats.put("pendingTasks", pendingTasks);

        // Map tasks list to return to UI
        List<Map<String, Object>> tasksList = assignedIssues.stream().map(issue -> {
            Map<String, Object> m = new HashMap<>();
            m.put("id", issue.getId());
            m.put("issueKey", issue.getIssueKey());
            m.put("title", issue.getTitle());
            m.put("status", issue.getStatus());
            m.put("priority", issue.getPriority());
            m.put("progress", issue.getProgress());
            m.put("remarks", issue.getRemarks());
            m.put("projectName", issue.getProject().getName());
            m.put("projectDeadline", issue.getProject().getDeadline());
            return m;
        }).collect(Collectors.toList());
        stats.put("tasks", tasksList);

        // Upcoming project deadlines for projects the employee is a member of
        List<Project> memberProjects = projectRepository.findByMembersContaining(employee);
        
        long totalProjects = memberProjects.size();
        long completedProjects = memberProjects.stream()
                .filter(p -> "COMPLETED".equalsIgnoreCase(p.getStatus()))
                .count();

        stats.put("totalProjects", totalProjects);
        stats.put("completedProjects", completedProjects);

        List<Map<String, Object>> assignedProjectsList = memberProjects.stream().map(p -> {
            Map<String, Object> m = new HashMap<>();
            m.put("id", p.getId());
            m.put("name", p.getName());
            m.put("key", p.getKey());
            m.put("description", p.getDescription());
            m.put("status", p.getStatus());
            m.put("priority", p.getPriority());
            m.put("deadline", p.getDeadline());
            return m;
        }).collect(Collectors.toList());
        stats.put("assignedProjects", assignedProjectsList);

        List<Map<String, Object>> deadlines = memberProjects.stream()
                .filter(p -> !"COMPLETED".equalsIgnoreCase(p.getStatus()))
                .filter(p -> p.getDeadline() != null && p.getDeadline().isAfter(LocalDate.now().minusDays(1)))
                .sorted(Comparator.comparing(Project::getDeadline))
                .limit(5)
                .map(p -> {
                    Map<String, Object> d = new HashMap<>();
                    d.put("projectId", p.getId());
                    d.put("projectName", p.getName());
                    d.put("projectKey", p.getKey());
                    d.put("deadline", p.getDeadline());
                    d.put("status", p.getStatus());
                    return d;
                }).collect(Collectors.toList());
        stats.put("upcomingDeadlines", deadlines);

        return ResponseEntity.ok(stats);
    }
}
