package com.smartep.project;

import com.smartep.exception.ResourceNotFoundException;
import com.smartep.exception.UnauthorizedException;
import com.smartep.project.dto.CreateProjectRequest;
import com.smartep.project.dto.ProjectResponse;
import com.smartep.employee.Employee;
import com.smartep.employee.Role;
import com.smartep.employee.EmployeeRepository;
import com.smartep.employee.dto.EmployeeSummaryResponse;
import com.smartep.issue.IssueRepository;
import com.smartep.audit.AuditLogService;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final EmployeeRepository userRepository;
    private final IssueRepository issueRepository;
    private final AuditLogService auditLogService;

    public ProjectService(ProjectRepository projectRepository, EmployeeRepository userRepository, IssueRepository issueRepository, AuditLogService auditLogService) {
        this.projectRepository = projectRepository;
        this.userRepository = userRepository;
        this.issueRepository = issueRepository;
        this.auditLogService = auditLogService;
    }

    public ResponseEntity<?> createProject(CreateProjectRequest request, UUID ownerId) {
        if (projectRepository.existsByKey(request.getKey())) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("message", "Project key already exists"));
        }

        Employee owner = userRepository.findById(ownerId).orElseThrow(() -> new ResourceNotFoundException("Employee", ownerId));
        Project project = new Project(request.getName(), request.getKey(), request.getDescription(), owner);
        if (request.getStatus() != null) project.setStatus(request.getStatus());
        if (request.getPriority() != null) project.setPriority(request.getPriority());
        if (request.getDeadline() != null) project.setDeadline(request.getDeadline());
        project.getMembers().add(owner);
        if (request.getMemberIds() != null) {
            for (UUID employeeId : request.getMemberIds()) {
                userRepository.findById(employeeId).ifPresent(employee -> project.getMembers().add(employee));
            }
        }
        projectRepository.save(project);
        auditLogService.log("PROJECT_CREATE", owner.getEmail(), "Created project: " + project.getName() + " (" + project.getKey() + ")");

        return ResponseEntity.status(HttpStatus.CREATED).body(mapToResponse(project));
    }

    public ResponseEntity<?> getProjectById(UUID projectId, UUID requesterId) {
        Project project = getProjectIfMemberOrAdmin(projectId, requesterId);
        return ResponseEntity.ok(mapToResponse(project));
    }

    public ResponseEntity<?> getProjectsByUser(UUID employeeId) {
        Employee employee = userRepository.findById(employeeId).orElseThrow(() -> new ResourceNotFoundException("Employee", employeeId));
        List<Project> projects;
        if (employee.getRole() == Role.ADMIN) {
            projects = projectRepository.findAll();
        } else {
            projects = projectRepository.findByMembersContaining(employee);
        }

        List<ProjectResponse> responses = projects.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());

        return ResponseEntity.ok(responses);
    }

    public ResponseEntity<?> updateProject(UUID projectId, CreateProjectRequest request, UUID requesterId) {
        Project project = getProjectIfOwner(projectId, requesterId);

        if (request.getName() != null)
            project.setName(request.getName());
        if (request.getDescription() != null)
            project.setDescription(request.getDescription());
        if (request.getStatus() != null)
            project.setStatus(request.getStatus());
        if (request.getPriority() != null)
            project.setPriority(request.getPriority());
        if (request.getDeadline() != null)
            project.setDeadline(request.getDeadline());

        if (request.getMemberIds() != null) {
            project.getMembers().clear();
            project.getMembers().add(project.getOwner());
            for (UUID employeeId : request.getMemberIds()) {
                userRepository.findById(employeeId).ifPresent(employee -> project.getMembers().add(employee));
            }
        }

        projectRepository.save(project);
        completeAllProjectTasks(project);
        Employee requester = userRepository.findById(requesterId).orElse(null);
        String requesterEmail = requester != null ? requester.getEmail() : "unknown";
        auditLogService.log("PROJECT_UPDATE", requesterEmail, "Updated project: " + project.getName() + " (" + project.getKey() + ")");
        return ResponseEntity.ok(mapToResponse(project));
    }

    public ResponseEntity<?> deleteProject(UUID projectId, UUID requesterId) {
        Project project = getProjectIfOwner(projectId, requesterId);
        projectRepository.delete(project);
        Employee requester = userRepository.findById(requesterId).orElse(null);
        String requesterEmail = requester != null ? requester.getEmail() : "unknown";
        auditLogService.log("PROJECT_DELETE", requesterEmail, "Deleted project: " + project.getName() + " (" + project.getKey() + ")");
        return ResponseEntity.noContent().build();
    }

    public Project getProjectIfOwner(UUID projectId, UUID requesterId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project", projectId));

        Employee requester = userRepository.findById(requesterId)
                .orElseThrow(() -> new ResourceNotFoundException("Employee", requesterId));

        if (!project.getOwner().getId().equals(requesterId) && requester.getRole() != Role.ADMIN) {
            throw new UnauthorizedException("You do not have permission to access this project");
        }

        return project;
    }

    public Project getProjectIfMemberOrAdmin(UUID projectId, UUID requesterId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project", projectId));

        Employee requester = userRepository.findById(requesterId)
                .orElseThrow(() -> new ResourceNotFoundException("Employee", requesterId));

        boolean isMember = project.getMembers().stream()
                .anyMatch(member -> member.getId().equals(requesterId));

        if (!project.getOwner().getId().equals(requesterId) && requester.getRole() != Role.ADMIN && !isMember) {
            throw new UnauthorizedException("You do not have permission to access this project");
        }

        return project;
    }

    public ResponseEntity<?> updateProjectStatus(UUID projectId, String status, UUID requesterId) {
        Project project = getProjectIfMemberOrAdmin(projectId, requesterId);
        project.setStatus(status.toUpperCase());
        projectRepository.save(project);
        completeAllProjectTasks(project);

        Employee requester = userRepository.findById(requesterId).orElse(null);
        String requesterEmail = requester != null ? requester.getEmail() : "unknown";
        auditLogService.log("PROJECT_STATUS_UPDATE", requesterEmail, "Updated project status: " + project.getName() + " to " + status);

        return ResponseEntity.ok(mapToResponse(project));
    }

    private ProjectResponse mapToResponse(Project project) {
        long issueCount = "COMPLETED".equalsIgnoreCase(project.getStatus()) ? 0 : issueRepository.countByProjectId(project.getId());
        return new ProjectResponse(
                project.getId(),
                project.getName(),
                project.getKey(),
                project.getDescription(),
                project.getOwner().getId(),
                project.getOwner().getName(),
                issueCount,
                project.getStatus(),
                project.getPriority(),
                project.getDeadline(),
                project.getCreatedAt());
    }

    private void completeAllProjectTasks(Project project) {
        if ("COMPLETED".equalsIgnoreCase(project.getStatus())) {
            List<com.smartep.issue.Issue> issues = issueRepository.findByProjectIdOrderByPositionAsc(project.getId());
            for (com.smartep.issue.Issue issue : issues) {
                issue.setStatus(com.smartep.issue.IssueStatus.DONE);
                issue.setProgress(100);
                issueRepository.save(issue);
            }
            auditLogService.log("PROJECT_COMPLETED_TASKS_DONE", "system", 
                "All tasks in project " + project.getName() + " marked as DONE because project was marked as COMPLETED.");
        }
    }

    public void addMember(UUID projectId, UUID userIdToAdd, UUID requesterId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project", projectId));

        Employee requester = userRepository.findById(requesterId)
                .orElseThrow(() -> new ResourceNotFoundException("Employee", requesterId));

        if (!project.getOwner().getId().equals(requesterId) && requester.getRole() != Role.ADMIN) {
            throw new UnauthorizedException("Only the project owner or administrator can add members");
        }

        Employee userToAdd = userRepository.findById(userIdToAdd)
                .orElseThrow(() -> new ResourceNotFoundException("Employee", userIdToAdd));

        if (project.getMembers().contains(userToAdd)) {
            throw new RuntimeException("Employee is already a member of this project");
        }

        project.getMembers().add(userToAdd);
        projectRepository.save(project);
        auditLogService.log("PROJECT_MEMBER_ADD", requester.getEmail(), "Added member " + userToAdd.getName() + " to project: " + project.getName());
    }

    public void removeMember(UUID projectId, UUID userIdToRemove, UUID requesterId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project", projectId));

        Employee requester = userRepository.findById(requesterId)
                .orElseThrow(() -> new ResourceNotFoundException("Employee", requesterId));

        if (!project.getOwner().getId().equals(requesterId) && requester.getRole() != Role.ADMIN) {
            throw new UnauthorizedException("Only the project owner or administrator can remove members");
        }

        if (project.getOwner().getId().equals(userIdToRemove)) {
            throw new RuntimeException("Cannot remove the project owner from the project");
        }

        Employee userToRemove = userRepository.findById(userIdToRemove)
                .orElseThrow(() -> new ResourceNotFoundException("Employee", userIdToRemove));

        project.getMembers().remove(userToRemove);
        projectRepository.save(project);
        auditLogService.log("PROJECT_MEMBER_REMOVE", requester.getEmail(), "Removed member " + userToRemove.getName() + " from project: " + project.getName());
    }

    public List<EmployeeSummaryResponse> getProjectMembers(UUID projectId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project", projectId));

        return project.getMembers()
                .stream()
                .map(u -> new EmployeeSummaryResponse(u.getId(), u.getName(), u.getEmail()))
                .collect(Collectors.toList());
    }
}
