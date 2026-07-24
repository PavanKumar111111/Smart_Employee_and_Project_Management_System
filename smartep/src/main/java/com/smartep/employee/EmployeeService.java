package com.smartep.employee;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.SimpleMailMessage;
import com.smartep.audit.AuditLogService;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import com.smartep.exception.ResourceNotFoundException;
import com.smartep.project.Project;
import com.smartep.security.JwtTokenProvider;
import com.smartep.security.EmployeePrincipal;
import com.smartep.employee.dto.AuthResponse;
import com.smartep.employee.dto.LoginRequest;
import com.smartep.employee.dto.RegisterRequest;
import com.smartep.employee.dto.EmployeeSummaryResponse;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class EmployeeService {

    private final EmployeeRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;
    private final AuditLogService auditLogService;
    private final JavaMailSender mailSender;

    public EmployeeService(EmployeeRepository userRepository, PasswordEncoder passwordEncoder, JwtTokenProvider tokenProvider, AuditLogService auditLogService, JavaMailSender mailSender) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.tokenProvider = tokenProvider;
        this.auditLogService = auditLogService;
        this.mailSender = mailSender;
    }

    public ResponseEntity<?> register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(java.util.Map.of("message", "Email already exists"));
        }

        Role role = Role.EMPLOYEE;
        if (request.getRole() != null) {
            try {
                role = Role.valueOf(request.getRole().toUpperCase());
            } catch (IllegalArgumentException e) {
                // ignore, default to EMPLOYEE
            }
        }

        Employee employee = new Employee(
                request.getName(),
                request.getEmail(),
                passwordEncoder.encode(request.getPassword()),
                role,
                request.getDepartment(),
                request.getDesignation(),
                request.getPhoneNumber(),
                "ACTIVE"
        );
        userRepository.save(employee);
        auditLogService.log("USER_REGISTER", employee.getEmail(), "Employee registered with role: " + employee.getRole().name());

        String token = tokenProvider.generateToken(new EmployeePrincipal(employee));
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new AuthResponse(token, employee.getId().toString(), employee.getName(), employee.getEmail(), employee.getRole().name()));
    }

    public ResponseEntity<?> login(LoginRequest request) {
        String loginId = request.getEmail();
        Employee employee = null;
        if ("Admin".equalsIgnoreCase(loginId) || "admin@company.com".equalsIgnoreCase(loginId)) {
            employee = userRepository.findByEmail("admin@company.com")
                    .orElseGet(() -> {
                        Employee newAdmin = new Employee();
                        newAdmin.setName("Admin");
                        newAdmin.setEmail("admin@company.com");
                        newAdmin.setPassword(passwordEncoder.encode("Admin@123"));
                        newAdmin.setRole(Role.ADMIN);
                        newAdmin.setDepartment("Management");
                        newAdmin.setDesignation("System Administrator");
                        newAdmin.setStatus("ACTIVE");
                        Employee savedAdmin = userRepository.save(newAdmin);
                        auditLogService.log("SYSTEM_SEED", "system", "Default Admin seeded to database");
                        return savedAdmin;
                    });
        } else {
            employee = userRepository.findByEmail(loginId).orElse(null);
        }

        if (employee == null || !passwordEncoder.matches(request.getPassword(), employee.getPassword())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(java.util.Map.of("message", "Invalid email or password"));
        }

        auditLogService.log("USER_LOGIN", employee.getEmail(), "Employee successfully logged in");

        String token = tokenProvider.generateToken(new EmployeePrincipal(employee));
        return ResponseEntity.ok(new AuthResponse(token, employee.getId().toString(), employee.getName(), employee.getEmail(), employee.getRole().name()));
    }

    public ResponseEntity<?> getCurrentEmployee(UUID employeeId) {
        Employee employee = userRepository.findById(employeeId)
                .orElseThrow(() -> new ResourceNotFoundException("Employee", employeeId));

        java.util.Map<String, Object> response = new java.util.HashMap<>();
        response.put("id", employee.getId());
        response.put("name", employee.getName());
        response.put("email", employee.getEmail());
        response.put("role", employee.getRole().name());
        response.put("department", employee.getDepartment() != null ? employee.getDepartment() : "");
        response.put("designation", employee.getDesignation() != null ? employee.getDesignation() : "");
        response.put("phoneNumber", employee.getPhoneNumber() != null ? employee.getPhoneNumber() : "");
        response.put("status", employee.getStatus() != null ? employee.getStatus() : "ACTIVE");
        response.put("profilePictureUrl", employee.getProfilePictureUrl() != null ? employee.getProfilePictureUrl() : "");
        response.put("createdAt", employee.getCreatedAt() != null ? employee.getCreatedAt().toString() : "");

        return ResponseEntity.ok(response);
    }
    
    public List<EmployeeSummaryResponse> searchEmployees(String query) {
        return userRepository.searchByNameOrEmail(query)
            .stream()
            .map(u -> new EmployeeSummaryResponse(u.getId(), u.getName(), u.getEmail()))
            .collect(Collectors.toList());
    }
    public List<EmployeeSummaryResponse> getAllEmployees() {
        return userRepository.findAll()
            .stream()
            .map(u -> new EmployeeSummaryResponse(u.getId(), u.getName(), u.getEmail()))
            .collect(Collectors.toList());
    }

    public Page<Employee> getEmployees(int page, int size, String sortBy, String sortDir, String search) {
        Sort sort = sortDir.equalsIgnoreCase(Sort.Direction.ASC.name()) ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);
        if (search == null || search.trim().isEmpty()) {
            return userRepository.findByRole(Role.EMPLOYEE, pageable);
        }
        return userRepository.findEmployees(Role.EMPLOYEE, search.trim(), pageable);
    }

    public Employee createEmployee(RegisterRequest request, org.springframework.web.multipart.MultipartFile file) throws Exception {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already exists");
        }
        Employee employee = new Employee(
                request.getName(),
                request.getEmail(),
                passwordEncoder.encode(request.getPassword()),
                Role.EMPLOYEE,
                request.getDepartment(),
                request.getDesignation(),
                request.getPhoneNumber(),
                "ACTIVE"
        );
        if (file != null && !file.isEmpty()) {
            byte[] bytes = file.getBytes();
            String base64Image = java.util.Base64.getEncoder().encodeToString(bytes);
            String contentType = file.getContentType();
            employee.setProfilePictureUrl("data:" + contentType + ";base64," + base64Image);
        }
        Employee saved = userRepository.save(employee);
        auditLogService.log("EMPLOYEE_CREATE", saved.getEmail(), "Admin created employee account: " + saved.getName());
        return saved;
    }

    public Employee updateEmployee(UUID employeeId, RegisterRequest request) {
        Employee employee = userRepository.findById(employeeId)
                .orElseThrow(() -> new ResourceNotFoundException("Employee", employeeId));

        if (request.getName() != null) employee.setName(request.getName());
        if (request.getEmail() != null && !request.getEmail().equals(employee.getEmail())) {
            if (userRepository.existsByEmail(request.getEmail())) {
                throw new RuntimeException("Email already exists");
            }
            employee.setEmail(request.getEmail());
        }
        if (request.getPassword() != null && !request.getPassword().isBlank()) {
            employee.setPassword(passwordEncoder.encode(request.getPassword()));
        }
        if (request.getDepartment() != null) employee.setDepartment(request.getDepartment());
        if (request.getDesignation() != null) employee.setDesignation(request.getDesignation());
        if (request.getPhoneNumber() != null) employee.setPhoneNumber(request.getPhoneNumber());
        if (request.getRole() != null) {
            try {
                employee.setRole(Role.valueOf(request.getRole().toUpperCase()));
            } catch(Exception e){}
        }
        Employee saved = userRepository.save(employee);
        auditLogService.log("EMPLOYEE_UPDATE", saved.getEmail(), "Admin updated employee account fields for: " + saved.getName());
        return saved;
    }

    public void deleteEmployee(UUID employeeId) {
        Employee employee = userRepository.findById(employeeId)
                .orElseThrow(() -> new ResourceNotFoundException("Employee", employeeId));
        userRepository.delete(employee);
        auditLogService.log("EMPLOYEE_DELETE", employee.getEmail(), "Admin deleted employee account: " + employee.getName());
    }

    public Employee updateProfilePicture(UUID employeeId, org.springframework.web.multipart.MultipartFile file) throws Exception {
        Employee employee = userRepository.findById(employeeId)
                .orElseThrow(() -> new ResourceNotFoundException("Employee", employeeId));
        byte[] bytes = file.getBytes();
        String base64Image = java.util.Base64.getEncoder().encodeToString(bytes);
        String contentType = file.getContentType();
        employee.setProfilePictureUrl("data:" + contentType + ";base64," + base64Image);
        
        auditLogService.log("PROFILE_PICTURE_UPLOAD", employee.getEmail(), "Uploaded new profile picture");
        return userRepository.save(employee);
    }

    public Employee getEmployeeById(UUID employeeId) {
        return userRepository.findById(employeeId)
                .orElseThrow(() -> new ResourceNotFoundException("Employee", employeeId));
    }

    private static final java.util.Map<String, String> otpMap = new java.util.concurrent.ConcurrentHashMap<>();

    public ResponseEntity<?> forgotPassword(String email) {
        if (!userRepository.existsByEmail(email)) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(java.util.Map.of("message", "Employee not found with this email"));
        }
        String code = String.format("%06d", new java.util.Random().nextInt(999999));
        otpMap.put(email, code);
        
        sendOtpEmail(email, code);

        return ResponseEntity.ok(java.util.Map.of("message", "Verification code sent to email successfully."));
    }

    private void sendOtpEmail(String toEmail, String otpCode) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom("mineemail100@gmail.com");
            message.setTo(toEmail);
            message.setSubject("Password Reset Verification Code - Smart E&P");
            message.setText("Hello,\n\n"
                    + "You have requested to reset your password. Please use the following 6-digit verification code:\n\n"
                    + "Verification Code: " + otpCode + "\n\n"
                    + "If you did not request this, please ignore this email.\n\n"
                    + "Best regards,\n"
                    + "Smart E&P Support Team");
            mailSender.send(message);
            System.out.println("[GMAIL SENDER] OTP successfully sent to email: " + toEmail);
        } catch (Exception e) {
            System.err.println("[GMAIL SENDER ERROR] Failed to send email to " + toEmail + ": " + e.getMessage());
            System.err.println("Ensure spring.mail.username and spring.mail.password are set correctly in application.yml.");
        }
    }

    public ResponseEntity<?> verifyOtp(String email, String code) {
        String storedCode = otpMap.get(email);
        if (storedCode != null && storedCode.equals(code)) {
            return ResponseEntity.ok(java.util.Map.of("message", "OTP verified successfully."));
        }
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(java.util.Map.of("message", "Invalid or expired verification code"));
    }

    public ResponseEntity<?> resetPassword(String email, String code, String newPassword) {
        String storedCode = otpMap.get(email);
        if (storedCode == null || !storedCode.equals(code)) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(java.util.Map.of("message", "Invalid or expired verification code"));
        }
        
        Employee employee = userRepository.findByEmail(email).orElse(null);
        if (employee == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(java.util.Map.of("message", "Employee not found"));
        }

        employee.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(employee);
        otpMap.remove(email);

        auditLogService.log(email, "RESET_PASSWORD", "Employee reset password successfully via forgot password flow.");
        return ResponseEntity.ok(java.util.Map.of("message", "Password reset successfully. You can now login."));
    }
}