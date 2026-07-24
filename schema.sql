-- Database schema definition for Smart Employee & Project Management System

CREATE DATABASE IF NOT EXISTS smartep;
USE smartep;

-- 1. Employees Table
CREATE TABLE IF NOT EXISTS employees (
    id BINARY(16) NOT NULL PRIMARY KEY,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'EMPLOYEE',
    designation VARCHAR(255),
    department VARCHAR(255),
    email VARCHAR(255) NOT NULL UNIQUE,
    phone_number VARCHAR(50),
    status VARCHAR(50) DEFAULT 'ACTIVE',
    password VARCHAR(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Projects Table
CREATE TABLE IF NOT EXISTS projects (
    id BINARY(16) NOT NULL PRIMARY KEY,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    name VARCHAR(255) NOT NULL,
    project_key VARCHAR(10) NOT NULL UNIQUE,
    description TEXT,
    priority VARCHAR(50) DEFAULT 'MEDIUM',
    status VARCHAR(50) DEFAULT 'PLANNED',
    deadline DATE,
    owner_id BINARY(16) NOT NULL,
    next_issue_number INT NOT NULL DEFAULT 1,
    FOREIGN KEY (owner_id) REFERENCES employees(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Project Members (Many-to-Many Bridge Table)
CREATE TABLE IF NOT EXISTS project_members (
    project_id BINARY(16) NOT NULL,
    employee_id BINARY(16) NOT NULL,
    PRIMARY KEY (project_id, employee_id),
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. Issues / Tasks Table
CREATE TABLE IF NOT EXISTS issues (
    id BINARY(16) NOT NULL PRIMARY KEY,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    title VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL DEFAULT 'TASK',
    issue_type VARCHAR(20),
    priority VARCHAR(50) NOT NULL DEFAULT 'MEDIUM',
    progress INT DEFAULT 0,
    remarks TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'TO_DO',
    assignee_id BINARY(16),
    reporter_id BINARY(16) NOT NULL,
    issue_key VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    position DOUBLE NOT NULL DEFAULT 0.0,
    project_id BINARY(16) NOT NULL,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (reporter_id) REFERENCES employees(id) ON DELETE CASCADE,
    FOREIGN KEY (assignee_id) REFERENCES employees(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
    id BINARY(16) NOT NULL PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    action VARCHAR(100) NOT NULL,
    details TEXT NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Default Admin Employee (Seeded on startup or manually here)
-- password hash matches "Admin@123" under standard BCrypt Strength 10
INSERT INTO employees (id, name, email, password, role, department, designation, status)
VALUES (
    UNHEX('49ca656c07684b41a368efcbca2fe0dc'),
    'Admin',
    'admin@company.com',
    '$2a$10$tMh4D4h9tXzH6vG7TugU6e59BqK1eT.gY0N0C0tN6U5w7PuhfK2eO', -- Admin@123
    'ADMIN',
    'Management',
    'System Administrator',
    'ACTIVE'
) ON DUPLICATE KEY UPDATE email=email;
