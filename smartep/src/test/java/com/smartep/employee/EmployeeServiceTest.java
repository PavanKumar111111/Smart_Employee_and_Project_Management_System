package com.smartep.employee;

import com.smartep.audit.AuditLogService;
import com.smartep.employee.dto.AuthResponse;
import com.smartep.employee.dto.LoginRequest;
import com.smartep.employee.dto.RegisterRequest;
import com.smartep.exception.ResourceNotFoundException;
import com.smartep.security.EmployeePrincipal;
import com.smartep.security.JwtTokenProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class EmployeeServiceTest {

    @Mock
    private EmployeeRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtTokenProvider tokenProvider;

    @Mock
    private AuditLogService auditLogService;

    @Mock
    private JavaMailSender mailSender;

    @InjectMocks
    private EmployeeService employeeService;

    private Employee testEmployee;
    private UUID employeeId;

    @BeforeEach
    void setUp() {
        employeeId = UUID.randomUUID();
        testEmployee = new Employee(
                "John Doe",
                "john.doe@company.com",
                "encodedPassword",
                Role.EMPLOYEE,
                "Engineering",
                "Developer",
                "1234567890",
                "ACTIVE"
        );
        testEmployee.setId(employeeId);
    }

    @Test
    void register_Success() {
        RegisterRequest request = new RegisterRequest();
        request.setName("John Doe");
        request.setEmail("john.doe@company.com");
        request.setPassword("Password@123");
        request.setRole("EMPLOYEE");
        request.setDepartment("Engineering");
        request.setDesignation("Developer");
        request.setPhoneNumber("1234567890");

        when(userRepository.existsByEmail(request.getEmail())).thenReturn(false);
        when(passwordEncoder.encode(request.getPassword())).thenReturn("encodedPassword");
        when(userRepository.save(any(Employee.class))).thenAnswer(invocation -> {
            Employee emp = invocation.getArgument(0);
            emp.setId(UUID.randomUUID());
            return emp;
        });
        when(tokenProvider.generateToken(any(EmployeePrincipal.class))).thenReturn("mockToken");

        ResponseEntity<?> responseEntity = employeeService.register(request);

        assertEquals(HttpStatus.CREATED, responseEntity.getStatusCode());
        assertNotNull(responseEntity.getBody());
        assertTrue(responseEntity.getBody() instanceof AuthResponse);

        AuthResponse authResponse = (AuthResponse) responseEntity.getBody();
        assertEquals("mockToken", authResponse.getToken());
        assertEquals("john.doe@company.com", authResponse.getEmail());
        assertEquals("EMPLOYEE", authResponse.getRole());

        verify(userRepository, times(1)).save(any(Employee.class));
        verify(auditLogService, times(1)).log(eq("USER_REGISTER"), eq("john.doe@company.com"), anyString());
    }

    @Test
    void register_Conflict_EmailExists() {
        RegisterRequest request = new RegisterRequest();
        request.setEmail("john.doe@company.com");

        when(userRepository.existsByEmail(request.getEmail())).thenReturn(true);

        ResponseEntity<?> response = employeeService.register(request);

        assertEquals(HttpStatus.CONFLICT, response.getStatusCode());
        assertTrue(response.getBody() instanceof Map);
        Map<?, ?> body = (Map<?, ?>) response.getBody();
        assertEquals("Email already exists", body.get("message"));

        verify(userRepository, never()).save(any(Employee.class));
    }

    @Test
    void login_Success_StandardUser() {
        LoginRequest request = new LoginRequest();
        request.setEmail("john.doe@company.com");
        request.setPassword("Password@123");

        when(userRepository.findByEmail(request.getEmail())).thenReturn(Optional.of(testEmployee));
        when(passwordEncoder.matches(request.getPassword(), testEmployee.getPassword())).thenReturn(true);
        when(tokenProvider.generateToken(any(EmployeePrincipal.class))).thenReturn("mockToken");

        ResponseEntity<?> responseEntity = employeeService.login(request);

        assertEquals(HttpStatus.OK, responseEntity.getStatusCode());
        assertNotNull(responseEntity.getBody());
        
        AuthResponse authResponse = (AuthResponse) responseEntity.getBody();
        assertEquals("mockToken", authResponse.getToken());
        assertEquals("john.doe@company.com", authResponse.getEmail());

        verify(auditLogService, times(1)).log(eq("USER_LOGIN"), eq("john.doe@company.com"), anyString());
    }

    @Test
    void login_Failure_InvalidCredentials() {
        LoginRequest request = new LoginRequest();
        request.setEmail("john.doe@company.com");
        request.setPassword("WrongPassword");

        when(userRepository.findByEmail(request.getEmail())).thenReturn(Optional.of(testEmployee));
        when(passwordEncoder.matches(request.getPassword(), testEmployee.getPassword())).thenReturn(false);

        ResponseEntity<?> response = employeeService.login(request);

        assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode());
        Map<?, ?> body = (Map<?, ?>) response.getBody();
        assertNotNull(body);
        assertEquals("Invalid email or password", body.get("message"));
    }

    @Test
    void getCurrentEmployee_Success() {
        when(userRepository.findById(employeeId)).thenReturn(Optional.of(testEmployee));

        ResponseEntity<?> response = employeeService.getCurrentEmployee(employeeId);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertTrue(response.getBody() instanceof Map);

        Map<?, ?> body = (Map<?, ?>) response.getBody();
        assertEquals(employeeId, body.get("id"));
        assertEquals("John Doe", body.get("name"));
        assertEquals("john.doe@company.com", body.get("email"));
        assertEquals("EMPLOYEE", body.get("role"));
    }

    @Test
    void getCurrentEmployee_NotFound() {
        UUID randomId = UUID.randomUUID();
        when(userRepository.findById(randomId)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> {
            employeeService.getCurrentEmployee(randomId);
        });
    }

    @Test
    void updateProfilePicture_Success() throws Exception {
        MultipartFile mockFile = mock(MultipartFile.class);
        byte[] content = "fake-image-bytes".getBytes();
        
        when(userRepository.findById(employeeId)).thenReturn(Optional.of(testEmployee));
        when(mockFile.getBytes()).thenReturn(content);
        when(mockFile.getContentType()).thenReturn("image/png");
        when(userRepository.save(any(Employee.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Employee updatedEmployee = employeeService.updateProfilePicture(employeeId, mockFile);

        assertNotNull(updatedEmployee);
        assertTrue(updatedEmployee.getProfilePictureUrl().startsWith("data:image/png;base64,"));
        verify(auditLogService, times(1)).log(eq("PROFILE_PICTURE_UPLOAD"), eq("john.doe@company.com"), anyString());
    }
}
