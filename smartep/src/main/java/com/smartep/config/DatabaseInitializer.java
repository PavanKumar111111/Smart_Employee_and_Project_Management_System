package com.smartep.config;

import com.smartep.employee.Role;
import com.smartep.employee.Employee;
import com.smartep.employee.EmployeeRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.jdbc.core.JdbcTemplate;

@Component
public class DatabaseInitializer implements CommandLineRunner {

    private final EmployeeRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JdbcTemplate jdbcTemplate;

    public DatabaseInitializer(EmployeeRepository userRepository, PasswordEncoder passwordEncoder, JdbcTemplate jdbcTemplate) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(String... args) throws Exception {
        // 1. Drop project_members if it contains legacy user_id column
        boolean hasUserIdColumn = false;
        try {
            jdbcTemplate.execute("SELECT user_id FROM project_members LIMIT 1");
            hasUserIdColumn = true;
        } catch (Exception e) {
            // Column does not exist
        }

        if (hasUserIdColumn) {
            System.out.println("Detected legacy user_id column in project_members. Re-creating table...");
            try {
                jdbcTemplate.execute("DROP TABLE IF EXISTS project_members");
                System.out.println("Dropped legacy project_members table successfully");
            } catch (Exception e) {
                System.err.println("Failed to drop legacy project_members table: " + e.getMessage());
            }
        }

        // Clean up any orphaned foreign keys in project_members, projects, and issues
        try {
            jdbcTemplate.execute("DELETE FROM project_members WHERE employee_id = UNHEX('00000000000000000000000000000000')");
            jdbcTemplate.execute("DELETE FROM project_members WHERE employee_id NOT IN (SELECT id FROM employees)");
            jdbcTemplate.execute("DELETE FROM project_members WHERE project_id NOT IN (SELECT id FROM projects)");
            
            jdbcTemplate.execute("DELETE FROM issues WHERE reporter_id NOT IN (SELECT id FROM employees)");
            jdbcTemplate.execute("UPDATE issues SET assignee_id = NULL WHERE assignee_id IS NOT NULL AND assignee_id NOT IN (SELECT id FROM employees)");
            jdbcTemplate.execute("DELETE FROM issues WHERE project_id NOT IN (SELECT id FROM projects)");

            jdbcTemplate.execute("DELETE FROM projects WHERE owner_id NOT IN (SELECT id FROM employees)");
            System.out.println("Database orphaned foreign key references cleaned up successfully");
        } catch (Exception e) {
            System.err.println("Error cleaning database references: " + e.getMessage());
        }

        // 2. Ensure default admin exists with fixed ID (49ca656c-0768-4b41-a368-efcbca2fe0dc)
        boolean hasFixedAdmin = false;
        try {
            Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM employees WHERE id = UNHEX('49ca656c07684b41a368efcbca2fe0dc')",
                Integer.class
            );
            hasFixedAdmin = (count != null && count > 0);
        } catch (Exception e) {
            // Table might not exist yet or empty
        }

        if (!hasFixedAdmin) {
            System.out.println("Seeding default Admin with fixed UUID: 49ca656c-0768-4b41-a368-efcbca2fe0dc");
            jdbcTemplate.execute("DELETE FROM employees WHERE email = 'admin@company.com'");
            jdbcTemplate.execute(
                "INSERT INTO employees (id, name, email, password, role, department, designation, status) " +
                "VALUES (" +
                "UNHEX('49ca656c07684b41a368efcbca2fe0dc'), " +
                "'Admin', " +
                "'admin@company.com', " +
                "'" + passwordEncoder.encode("Admin@123") + "', " +
                "'ADMIN', " +
                "'Management', " +
                "'System Administrator', " +
                "'ACTIVE')"
            );
        } else {
            userRepository.findByEmail("admin@company.com").ifPresent(admin -> {
                admin.setPassword(passwordEncoder.encode("Admin@123"));
                userRepository.save(admin);
                System.out.println("Default admin employee password verified as Admin@123");
            });
        }
    }
}
