package com.smartep.search;

import com.smartep.issue.Issue;
import com.smartep.issue.IssuePriority;
import com.smartep.issue.IssueRepository;
import com.smartep.issue.IssueStatus;
import com.smartep.project.Project;
import com.smartep.project.ProjectRepository;
import com.smartep.employee.Role;
import com.smartep.employee.Employee;
import com.smartep.employee.EmployeeRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/search")
public class SearchController {

    private final EmployeeRepository userRepository;
    private final ProjectRepository projectRepository;
    private final IssueRepository issueRepository;

    public SearchController(EmployeeRepository userRepository, ProjectRepository projectRepository, IssueRepository issueRepository) {
        this.userRepository = userRepository;
        this.projectRepository = projectRepository;
        this.issueRepository = issueRepository;
    }

    @GetMapping("/employees")
    public ResponseEntity<?> searchEmployees(
            @RequestParam(required = false, defaultValue = "") String query,
            @RequestParam(required = false) String department,
            @RequestParam(required = false) String status) {
        
        List<Employee> employees = userRepository.findAll().stream()
                .filter(u -> u.getRole() == Role.EMPLOYEE)
                .filter(u -> query.isBlank() || u.getName().toLowerCase().contains(query.toLowerCase()) || u.getEmail().toLowerCase().contains(query.toLowerCase()))
                .filter(u -> department == null || department.isBlank() || (u.getDepartment() != null && u.getDepartment().equalsIgnoreCase(department)))
                .filter(u -> status == null || status.isBlank() || (u.getStatus() != null && u.getStatus().equalsIgnoreCase(status)))
                .collect(Collectors.toList());

        return ResponseEntity.ok(employees);
    }

    @GetMapping("/projects")
    public ResponseEntity<?> searchProjects(
            @RequestParam(required = false, defaultValue = "") String query,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String priority,
            @RequestParam(required = false) String date) {

        List<Project> projects = projectRepository.findAll().stream()
                .filter(p -> query.isBlank() || p.getName().toLowerCase().contains(query.toLowerCase()) || p.getKey().toLowerCase().contains(query.toLowerCase()))
                .filter(p -> status == null || status.isBlank() || p.getStatus().equalsIgnoreCase(status))
                .filter(p -> priority == null || priority.isBlank() || p.getPriority().equalsIgnoreCase(priority))
                .filter(p -> {
                    if (date == null || date.isBlank()) return true;
                    try {
                        LocalDate d = LocalDate.parse(date);
                        return p.getDeadline() != null && p.getDeadline().equals(d);
                    } catch (Exception e) {
                        return true;
                    }
                })
                .collect(Collectors.toList());

        return ResponseEntity.ok(projects);
    }

    @GetMapping("/tasks")
    public ResponseEntity<?> searchTasks(
            @RequestParam(required = false, defaultValue = "") String query,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String priority,
            @RequestParam(required = false) String date) {

        List<Issue> issues = issueRepository.findAll().stream()
                .filter(i -> query.isBlank() || i.getTitle().toLowerCase().contains(query.toLowerCase()) || i.getIssueKey().toLowerCase().contains(query.toLowerCase()) || (i.getDescription() != null && i.getDescription().toLowerCase().contains(query.toLowerCase())))
                .filter(i -> {
                    if (status == null || status.isBlank()) return true;
                    try {
                        IssueStatus s = IssueStatus.valueOf(status.toUpperCase());
                        return i.getStatus() == s;
                    } catch (Exception e) {
                        return true;
                    }
                })
                .filter(i -> {
                    if (priority == null || priority.isBlank()) return true;
                    try {
                        IssuePriority p = IssuePriority.valueOf(priority.toUpperCase());
                        return i.getPriority() == p;
                    } catch (Exception e) {
                        return true;
                    }
                })
                .filter(i -> {
                    if (date == null || date.isBlank()) return true;
                    try {
                        LocalDate d = LocalDate.parse(date);
                        return i.getCreatedAt() != null && i.getCreatedAt().toLocalDate().equals(d);
                    } catch (Exception e) {
                        return true;
                    }
                })
                .collect(Collectors.toList());

        return ResponseEntity.ok(issues.stream().map(this::mapTaskToMap).collect(Collectors.toList()));
    }

    private java.util.Map<String, Object> mapTaskToMap(Issue issue) {
        java.util.Map<String, Object> map = new java.util.HashMap<>();
        map.put("id", issue.getId());
        map.put("issueKey", issue.getIssueKey());
        map.put("title", issue.getTitle());
        map.put("description", issue.getDescription());
        map.put("status", issue.getStatus());
        map.put("priority", issue.getPriority());
        map.put("type", issue.getType());
        map.put("progress", issue.getProgress());
        map.put("remarks", issue.getRemarks());
        map.put("projectId", issue.getProject().getId());
        map.put("projectKey", issue.getProject().getKey());
        map.put("projectName", issue.getProject().getName());
        map.put("createdAt", issue.getCreatedAt());
        map.put("updatedAt", issue.getUpdatedAt());
        if (issue.getAssignee() != null) {
            map.put("assigneeId", issue.getAssignee().getId());
            map.put("assigneeName", issue.getAssignee().getName());
        }
        if (issue.getReporter() != null) {
            map.put("reporterId", issue.getReporter().getId());
            map.put("reporterName", issue.getReporter().getName());
        }
        return map;
    }
}
