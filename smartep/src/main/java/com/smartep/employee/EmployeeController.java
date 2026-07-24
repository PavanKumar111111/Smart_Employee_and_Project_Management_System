package com.smartep.employee;

import com.smartep.security.EmployeePrincipal;

import java.util.List;
import java.util.UUID;
import org.springframework.security.access.prepost.PreAuthorize;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import com.smartep.employee.dto.LoginRequest;
import com.smartep.employee.dto.RegisterRequest;
import com.smartep.employee.dto.EmployeeSummaryResponse;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api")
public class EmployeeController {

    private final EmployeeService userService;
    private final com.smartep.security.JwtTokenProvider jwtTokenProvider;
    private final com.smartep.audit.AuditLogService auditLogService;

    @Autowired
    public EmployeeController(EmployeeService userService, com.smartep.security.JwtTokenProvider jwtTokenProvider, com.smartep.audit.AuditLogService auditLogService) {
        this.userService = userService;
        this.jwtTokenProvider = jwtTokenProvider;
        this.auditLogService = auditLogService;
    }

    @PostMapping("/auth/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
            .body(java.util.Map.of("message", "Self-registration is disabled. Every new employee must be created by the administrator."));
    }

    @PostMapping("/auth/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody java.util.Map<String, String> body) {
        String email = body.get("email");
        if (email == null || email.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(java.util.Map.of("message", "Email is required"));
        }
        return userService.forgotPassword(email.trim());
    }

    @PostMapping("/auth/verify-otp")
    public ResponseEntity<?> verifyOtp(@RequestBody java.util.Map<String, String> body) {
        String email = body.get("email");
        String code = body.get("code");
        if (email == null || code == null || email.trim().isEmpty() || code.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(java.util.Map.of("message", "Email and verification code are required"));
        }
        return userService.verifyOtp(email.trim(), code.trim());
    }

    @PostMapping("/auth/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody java.util.Map<String, String> body) {
        String email = body.get("email");
        String code = body.get("code");
        String newPassword = body.get("newPassword");
        if (email == null || code == null || newPassword == null || email.trim().isEmpty() || code.trim().isEmpty() || newPassword.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(java.util.Map.of("message", "Email, code, and newPassword are required"));
        }
        if (newPassword.length() < 8) {
            return ResponseEntity.badRequest().body(java.util.Map.of("message", "Password must be at least 8 characters"));
        }
        return userService.resetPassword(email.trim(), code.trim(), newPassword);
    }

    @PostMapping("/auth/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request) {
        return userService.login(request);
    }

    @GetMapping("/employees/me")
    public ResponseEntity<?> getCurrentEmployee(@AuthenticationPrincipal EmployeePrincipal userPrincipal) {
        return userService.getCurrentEmployee(userPrincipal.getId());
    }
    
    @GetMapping("/employees/search")
    public ResponseEntity<List<EmployeeSummaryResponse>> searchEmployees(
            @RequestParam String query) {
        return ResponseEntity.ok(userService.searchEmployees(query));
    }

    @GetMapping("/admin/employees")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getEmployees(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "name") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDir,
            @RequestParam(defaultValue = "") String search) {
        return ResponseEntity.ok(userService.getEmployees(page, size, sortBy, sortDir, search));
    }

    @PostMapping(value = "/admin/employees", consumes = org.springframework.http.MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> createEmployee(
            @ModelAttribute @Valid RegisterRequest request,
            @RequestParam(value = "file", required = false) org.springframework.web.multipart.MultipartFile file) {
        try {
            Employee employee = userService.createEmployee(request, file);
            return ResponseEntity.status(HttpStatus.CREATED).body(employee);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(java.util.Map.of("message", e.getMessage()));
        }
    }

    @PutMapping("/admin/employees/{employeeId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> updateEmployee(
            @PathVariable UUID employeeId,
            @RequestBody RegisterRequest request) {
        try {
            Employee employee = userService.updateEmployee(employeeId, request);
            return ResponseEntity.ok(employee);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(java.util.Map.of("message", e.getMessage()));
        }
    }

    @DeleteMapping("/admin/employees/{employeeId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteEmployee(@PathVariable UUID employeeId) {
        try {
            userService.deleteEmployee(employeeId);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(java.util.Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/employees/{employeeId}/profile-picture")
    public ResponseEntity<?> uploadProfilePicture(
            @PathVariable UUID employeeId,
            @RequestParam("file") org.springframework.web.multipart.MultipartFile file,
            @AuthenticationPrincipal EmployeePrincipal userPrincipal) {
        try {
            System.out.println("uploadProfilePicture request: principal ID = " + userPrincipal.getId() + " | path ID = " + employeeId);
            boolean isAdmin = userPrincipal.getAuthorities().stream()
                    .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
            if (!isAdmin && !userPrincipal.getId().equals(employeeId)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(java.util.Map.of("message", "You can only update your own profile picture"));
            }
            Employee employee = userService.updateProfilePicture(employeeId, file);
            return ResponseEntity.ok(employee);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(java.util.Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/admin/employees/{employeeId}/impersonate")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> impersonateEmployee(@PathVariable UUID employeeId) {
        try {
            Employee employee = userService.getEmployeeById(employeeId);
            EmployeePrincipal principal = new EmployeePrincipal(employee);
            String token = jwtTokenProvider.generateToken(principal);
            
            com.smartep.employee.dto.AuthResponse response = new com.smartep.employee.dto.AuthResponse();
            response.setToken(token);
            response.setUserId(employee.getId().toString());
            response.setName(employee.getName());
            response.setEmail(employee.getEmail());
            response.setRole(employee.getRole().name());
            
            auditLogService.log("ADMIN_IMPERSONATE", "admin@company.com", "Admin impersonated employee: " + employee.getName());

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(java.util.Map.of("message", e.getMessage()));
        }
    }
}