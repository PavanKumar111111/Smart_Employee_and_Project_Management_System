package com.smartep.issue;

import com.smartep.issue.dto.CreateIssueRequest;
import com.smartep.issue.dto.UpdateIssueRequest;
import com.smartep.security.EmployeePrincipal;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/projects/{projectId}/issues")
public class IssueController {

    private final IssueService issueService;

    public IssueController(IssueService issueService) {
        this.issueService = issueService;
    }

    @GetMapping
    public ResponseEntity<?> getIssues(@PathVariable UUID projectId) {
        return issueService.getIssuesByProject(projectId);
    }

    @PostMapping
    public ResponseEntity<?> createIssue(@PathVariable UUID projectId,
            @Valid @RequestBody CreateIssueRequest request,
            @AuthenticationPrincipal EmployeePrincipal userPrincipal) {
        return issueService.createIssue(projectId, request, userPrincipal.getId());
    }

    @GetMapping("/{issueId}")
    public ResponseEntity<?> getIssue(@PathVariable UUID projectId,
            @PathVariable UUID issueId) {
        return issueService.getIssueById(projectId, issueId);
    }

    @PutMapping("/{issueId}")
    public ResponseEntity<?> updateIssue(@PathVariable UUID projectId,
            @PathVariable UUID issueId,
            @RequestBody UpdateIssueRequest request,
            @AuthenticationPrincipal EmployeePrincipal userPrincipal) {
        return issueService.updateIssue(projectId, issueId, request, userPrincipal.getId());
    }

    @PatchMapping("/{issueId}/status")
    public ResponseEntity<?> updateStatus(@PathVariable UUID projectId,
            @PathVariable UUID issueId,
            @RequestBody Map<String, String> requestBody,
            @AuthenticationPrincipal EmployeePrincipal userPrincipal) {
        return issueService.updateStatus(projectId, issueId, requestBody, userPrincipal.getId());
    }

    @PatchMapping("/{issueId}/assignee")
    public ResponseEntity<?> assignIssue(@PathVariable UUID projectId,
            @PathVariable UUID issueId,
            @RequestBody Map<String, UUID> requestBody,
            @AuthenticationPrincipal EmployeePrincipal userPrincipal) {
        return issueService.assignIssue(projectId, issueId, requestBody, userPrincipal.getId());
    }

    @DeleteMapping("/{issueId}")
    public ResponseEntity<?> deleteIssue(@PathVariable UUID projectId,
            @PathVariable UUID issueId,
            @AuthenticationPrincipal EmployeePrincipal userPrincipal) {
        return issueService.deleteIssue(projectId, issueId, userPrincipal.getId());
    }
}
