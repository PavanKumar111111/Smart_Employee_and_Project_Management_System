package com.smartep.project;

import com.smartep.project.dto.AddMemberRequest;
import com.smartep.project.dto.CreateProjectRequest;
import com.smartep.security.EmployeePrincipal;
import com.smartep.employee.EmployeeService;
import com.smartep.employee.dto.EmployeeSummaryResponse;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/projects")
public class ProjectController {

    private final ProjectService projectService;
    private final EmployeeService userService;

    public ProjectController(ProjectService projectService,EmployeeService userService) {
        this.projectService = projectService;
        this.userService = userService;
    }

    @PostMapping
    public ResponseEntity<?> createProject(@Valid @RequestBody CreateProjectRequest request,
            @AuthenticationPrincipal EmployeePrincipal userPrincipal) {
        return projectService.createProject(request, userPrincipal.getId());
    }

    @GetMapping
    public ResponseEntity<?> getMyProjects(@AuthenticationPrincipal EmployeePrincipal userPrincipal) {
        return projectService.getProjectsByUser(userPrincipal.getId());
    }

    @GetMapping("/{projectId}")
    public ResponseEntity<?> getProject(@PathVariable UUID projectId,
            @AuthenticationPrincipal EmployeePrincipal userPrincipal) {
        return projectService.getProjectById(projectId, userPrincipal.getId());
    }

    @PutMapping("/{projectId}")
    public ResponseEntity<?> updateProject(@PathVariable UUID projectId,
            @RequestBody CreateProjectRequest request,
            @AuthenticationPrincipal EmployeePrincipal userPrincipal) {
        return projectService.updateProject(projectId, request, userPrincipal.getId());
    }

    @DeleteMapping("/{projectId}")
    public ResponseEntity<?> deleteProject(@PathVariable UUID projectId,
            @AuthenticationPrincipal EmployeePrincipal userPrincipal) {
        return projectService.deleteProject(projectId, userPrincipal.getId());
    }
    
    @GetMapping("/{projectId}/members")
    public ResponseEntity<List<EmployeeSummaryResponse>> getProjectMembers(@PathVariable UUID projectId) {

		List<EmployeeSummaryResponse> members = userService.getAllEmployees();
        return ResponseEntity.ok(members);
    }
    
    // Add a member to the project
    @PostMapping("/{projectId}/members")
    public ResponseEntity<String> addMember(
            @PathVariable UUID projectId,
            @RequestBody AddMemberRequest request,
            @AuthenticationPrincipal EmployeePrincipal currentUser) {

        projectService.addMember(projectId, request.getUserId(), currentUser.getId());
        return ResponseEntity.ok("Member added successfully");
    }

    // Remove a member from the project
    @DeleteMapping("/{projectId}/members/{employeeId}")
    public ResponseEntity<Void> removeMember(
            @PathVariable UUID projectId,
            @PathVariable UUID employeeId,
            @AuthenticationPrincipal EmployeePrincipal currentUser) {

        projectService.removeMember(projectId, employeeId, currentUser.getId());
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{projectId}/status")
    public ResponseEntity<?> updateProjectStatus(
            @PathVariable UUID projectId,
            @RequestBody java.util.Map<String, String> requestBody,
            @AuthenticationPrincipal EmployeePrincipal userPrincipal) {
        String status = requestBody.get("status");
        return projectService.updateProjectStatus(projectId, status, userPrincipal.getId());
    }
    
//    @GetMapping("/{projectId}/members")
//    public ResponseEntity<List<EmployeeSummaryResponse>> getProjectMembers(
//            @PathVariable UUID projectId) {
//
//        List<EmployeeSummaryResponse> members = projectService.getProjectMembers(projectId);
//        return ResponseEntity.ok(members);
//    }
}
