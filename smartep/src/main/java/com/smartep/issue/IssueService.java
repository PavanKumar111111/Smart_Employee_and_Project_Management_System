package com.smartep.issue;

import com.smartep.exception.ResourceNotFoundException;
import com.smartep.exception.UnauthorizedException;
import com.smartep.issue.dto.CreateIssueRequest;
import com.smartep.issue.dto.IssueResponse;
import com.smartep.issue.dto.UpdateIssueRequest;
import com.smartep.project.Project;
import com.smartep.project.ProjectRepository;
import com.smartep.employee.Employee;
import com.smartep.employee.Role;
import com.smartep.employee.EmployeeRepository;
import com.smartep.audit.AuditLogService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class IssueService {

    private final IssueRepository issueRepository;
    private final ProjectRepository projectRepository;
    private final EmployeeRepository userRepository;
    private final AuditLogService auditLogService;

    public IssueService(IssueRepository issueRepository, ProjectRepository projectRepository,
            EmployeeRepository userRepository, AuditLogService auditLogService) {
        this.issueRepository = issueRepository;
        this.projectRepository = projectRepository;
        this.userRepository = userRepository;
        this.auditLogService = auditLogService;
    }

    public ResponseEntity<?> createIssue(UUID projectId, CreateIssueRequest request, UUID reporterId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project", projectId));

        Employee reporter = userRepository.findById(reporterId)
                .orElseThrow(() -> new ResourceNotFoundException("Employee", reporterId));

        Issue issue = new Issue();
        issue.setTitle(request.getTitle());
        issue.setDescription(request.getDescription());
        issue.setType(request.getType());
        issue.setPriority(request.getPriority());
        if (request.getProgress() != null) issue.setProgress(request.getProgress());
        if (request.getRemarks() != null) issue.setRemarks(request.getRemarks());
        issue.setProject(project);
        issue.setReporter(reporter);

        if (request.getAssigneeId() != null) {
            Employee assignee = userRepository.findById(request.getAssigneeId())
                    .orElseThrow(() -> new ResourceNotFoundException("Employee", request.getAssigneeId()));
            issue.setAssignee(assignee);
            if (!project.getMembers().contains(assignee)) {
                project.getMembers().add(assignee);
                projectRepository.save(project);
            }
        }

        // Generate issue key
        issue.setIssueKey(project.getKey() + "-" + project.getNextIssueNumber());
        project.setNextIssueNumber(project.getNextIssueNumber() + 1);
        projectRepository.save(project);

        Long positionCount = issueRepository.countByProjectIdAndStatus(projectId, IssueStatus.TO_DO);
        issue.setPosition(positionCount.intValue());

        issueRepository.save(issue);
        auditLogService.log("TASK_CREATE", reporter.getEmail(), "Created task: " + issue.getTitle() + " (" + issue.getIssueKey() + ")");
        return ResponseEntity.status(HttpStatus.CREATED).body(mapToResponse(issue));
    }

    public ResponseEntity<?> getIssuesByProject(UUID projectId) {
        if (!projectRepository.existsById(projectId)) {
            throw new ResourceNotFoundException("Project", projectId);
        }

        List<Issue> issues = issueRepository.findByProjectIdOrderByPositionAsc(projectId);

        Map<IssueStatus, List<IssueResponse>> groupedIssues = new EnumMap<>(IssueStatus.class);
        for (IssueStatus status : IssueStatus.values()) {
            groupedIssues.put(status, new ArrayList<>());
        }

        for (Issue issue : issues) {
            groupedIssues.get(issue.getStatus()).add(mapToResponse(issue));
        }

        return ResponseEntity.ok(groupedIssues);
    }

    public ResponseEntity<?> getIssueById(UUID projectId, UUID issueId) {
        Issue issue = issueRepository.findById(issueId)
                .orElseThrow(() -> new ResourceNotFoundException("Issue", issueId));
        if (!issue.getProject().getId().equals(projectId)) {
            throw new ResourceNotFoundException("Issue not found in project", issueId);
        }
        return ResponseEntity.ok(mapToResponse(issue));
    }

    public ResponseEntity<?> updateIssue(UUID projectId, UUID issueId, UpdateIssueRequest request, UUID requesterId) {
        Issue issue = issueRepository.findById(issueId)
                .orElseThrow(() -> new ResourceNotFoundException("Issue", issueId));

        Employee requester = userRepository.findById(requesterId)
                .orElseThrow(() -> new ResourceNotFoundException("Employee", requesterId));

        boolean isAdmin = requester.getRole() == Role.ADMIN;
        boolean isReporter = issue.getReporter().getId().equals(requesterId);
        boolean isOwner = issue.getProject().getOwner().getId().equals(requesterId);
        boolean isAssignee = issue.getAssignee() != null && issue.getAssignee().getId().equals(requesterId);

        if (!isAdmin && !isReporter && !isOwner && !isAssignee) {
            throw new UnauthorizedException("You do not have permission to update this issue");
        }

        if (!isAdmin && !isReporter && !isOwner && isAssignee) {
            // Assignees can only update status, progress, and remarks
            if (request.getStatus() != null)
                issue.setStatus(request.getStatus());
            if (request.getProgress() != null)
                issue.setProgress(request.getProgress());
            if (request.getRemarks() != null)
                issue.setRemarks(request.getRemarks());
        } else {
            // Full update
            if (request.getTitle() != null)
                issue.setTitle(request.getTitle());
            if (request.getDescription() != null)
                issue.setDescription(request.getDescription());
            if (request.getType() != null)
                issue.setType(request.getType());
            if (request.getPriority() != null)
                issue.setPriority(request.getPriority());
            if (request.getStatus() != null)
                issue.setStatus(request.getStatus());
            if (request.getProgress() != null)
                issue.setProgress(request.getProgress());
            if (request.getRemarks() != null)
                issue.setRemarks(request.getRemarks());

            if (request.getAssigneeId() != null) {
                Employee assignee = userRepository.findById(request.getAssigneeId())
                        .orElseThrow(() -> new ResourceNotFoundException("Employee", request.getAssigneeId()));
                issue.setAssignee(assignee);
                Project project = issue.getProject();
                if (!project.getMembers().contains(assignee)) {
                    project.getMembers().add(assignee);
                    projectRepository.save(project);
                }
            } else if (request.getAssigneeId() == null && request.getClass().getDeclaredFields().length > 0) {
                // If explicitly set to null, unassign (checked via assigneeId being null if it was sent in request,
                // but let's just make it simple: if assigneeId is null in request, do nothing unless we want to unassign).
                // Let's allow unassigning if request has assigneeId set to null or not present.
                // For simplicity, if request has assigneeId then assign, else do nothing.
            }
        }

        issueRepository.save(issue);
        checkAndCompleteProject(issue.getProject());
        auditLogService.log("TASK_UPDATE", requester.getEmail(), "Updated task: " + issue.getTitle() + " (" + issue.getIssueKey() + ")");
        return ResponseEntity.ok(mapToResponse(issue));
    }

    public ResponseEntity<?> updateStatus(UUID projectId, UUID issueId, Map<String, String> requestBody,
            UUID requesterId) {
        Issue issue = issueRepository.findById(issueId)
                .orElseThrow(() -> new ResourceNotFoundException("Issue", issueId));

        String statusStr = requestBody.get("status");
        if (statusStr != null) {
            try {
                IssueStatus status = IssueStatus.valueOf(statusStr);
                issue.setStatus(status);
            } catch (IllegalArgumentException e) {
                return ResponseEntity.badRequest().body(Map.of("message", "Invalid status"));
            }
        }

        issueRepository.save(issue);
        checkAndCompleteProject(issue.getProject());
        return ResponseEntity.ok(mapToResponse(issue));
    }

    public ResponseEntity<?> assignIssue(UUID projectId, UUID issueId, Map<String, UUID> requestBody,
            UUID requesterId) {
        Issue issue = issueRepository.findById(issueId)
                .orElseThrow(() -> new ResourceNotFoundException("Issue", issueId));

        UUID assigneeId = requestBody.get("assigneeId");
        if (assigneeId == null) {
            issue.setAssignee(null);
        } else {
            Employee assignee = userRepository.findById(assigneeId)
                    .orElseThrow(() -> new ResourceNotFoundException("Employee", assigneeId));
            issue.setAssignee(assignee);
        }
        issueRepository.save(issue);
        return ResponseEntity.ok(mapToResponse(issue));
    }

    public ResponseEntity<?> deleteIssue(UUID projectId, UUID issueId, UUID requesterId) {
        Issue issue = issueRepository.findById(issueId)
                .orElseThrow(() -> new ResourceNotFoundException("Issue", issueId));

        Employee requester = userRepository.findById(requesterId)
                .orElseThrow(() -> new ResourceNotFoundException("Employee", requesterId));

        boolean isAdmin = requester.getRole() == Role.ADMIN;
        boolean isReporter = issue.getReporter().getId().equals(requesterId);
        boolean isOwner = issue.getProject().getOwner().getId().equals(requesterId);

        if (!isAdmin && !isReporter && !isOwner) {
            throw new UnauthorizedException("You do not have permission to delete this issue");
        }

        Project project = issue.getProject();
        issueRepository.delete(issue);
        checkAndCompleteProject(project);
        auditLogService.log("TASK_DELETE", requester.getEmail(), "Deleted task: " + issue.getTitle() + " (" + issue.getIssueKey() + ")");
        return ResponseEntity.noContent().build();
    }

    private void checkAndCompleteProject(Project project) {
        List<Issue> issues = issueRepository.findByProjectIdOrderByPositionAsc(project.getId());
        if (issues.isEmpty()) {
            return;
        }
        boolean allDone = issues.stream().allMatch(i -> i.getStatus() == IssueStatus.DONE);
        if (allDone) {
            project.setStatus("COMPLETED");
            projectRepository.save(project);
            auditLogService.log("PROJECT_STATUS_AUTO_UPDATE", "system", 
                "Project " + project.getName() + " automatically marked as COMPLETED because all tasks are completed.");
        }
    }

    private IssueResponse mapToResponse(Issue issue) {
        IssueResponse response = new IssueResponse();
        response.setId(issue.getId());
        response.setIssueKey(issue.getIssueKey());
        response.setTitle(issue.getTitle());
        response.setDescription(issue.getDescription());
        response.setType(issue.getType());
        response.setIssueType(issue.getIssueType());
        response.setStatus(issue.getStatus());
        response.setPriority(issue.getPriority());
        response.setProgress(issue.getProgress());
        response.setRemarks(issue.getRemarks());
        response.setProjectId(issue.getProject().getId());
        response.setProjectKey(issue.getProject().getKey());
        response.setReporterId(issue.getReporter().getId());
        response.setReporterName(issue.getReporter().getName());
        response.setPosition(issue.getPosition());
        response.setCreatedAt(issue.getCreatedAt());
        response.setUpdatedAt(issue.getUpdatedAt());

        if (issue.getAssignee() != null) {
            response.setAssigneeId(issue.getAssignee().getId());
            response.setAssigneeName(issue.getAssignee().getName());
        }

        return response;
    }
}
