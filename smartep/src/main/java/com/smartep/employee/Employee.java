package com.smartep.employee;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.smartep.project.Project;
import com.smartep.issue.Issue;

import java.time.LocalDateTime;
import java.util.UUID;
import java.util.Set;
import java.util.HashSet;

@Entity
@Table(name = "employees")
public class Employee {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Role role = Role.EMPLOYEE;

    @Column(length = 100)
    private String designation;

    @Column(length = 100)
    private String department;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(length = 20)
    private String phoneNumber;

    @Column(nullable = false, length = 20)
    private String status = "ACTIVE";

    @Column(nullable = false)
    private String password;

    @Column(columnDefinition = "LONGTEXT")
    private String profilePictureUrl;

    @OneToMany(mappedBy = "owner", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnore
    private Set<Project> ownedProjects = new HashSet<>();

    @OneToMany(mappedBy = "assignee", fetch = FetchType.LAZY)
    @JsonIgnore
    private Set<Issue> assignedIssues = new HashSet<>();

    @OneToMany(mappedBy = "reporter", fetch = FetchType.LAZY)
    @JsonIgnore
    private Set<Issue> reportedIssues = new HashSet<>();

    @ManyToMany(mappedBy = "members")
    @JsonIgnore
    private Set<Project> memberProjects = new HashSet<>();

    public Employee() {
    }

    public Employee(String name, String email, String password) {
        this.name = name;
        this.email = email;
        this.password = password;
    }

    public Employee(String name, String email, String password, Role role, String department, String designation, String phoneNumber, String status) {
        this.name = name;
        this.email = email;
        this.password = password;
        this.role = role;
        this.department = department;
        this.designation = designation;
        this.phoneNumber = phoneNumber;
        this.status = status;
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public Role getRole() {
        return role;
    }

    public void setRole(Role role) {
        this.role = role;
    }

    public String getDepartment() {
        return department;
    }

    public void setDepartment(String department) {
        this.department = department;
    }

    public String getDesignation() {
        return designation;
    }

    public void setDesignation(String designation) {
        this.designation = designation;
    }

    public String getPhoneNumber() {
        return phoneNumber;
    }

    public void setPhoneNumber(String phoneNumber) {
        this.phoneNumber = phoneNumber;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getProfilePictureUrl() {
        return profilePictureUrl;
    }

    public void setProfilePictureUrl(String profilePictureUrl) {
        this.profilePictureUrl = profilePictureUrl;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public Set<Project> getOwnedProjects() {
        return ownedProjects;
    }

    public void setOwnedProjects(Set<Project> ownedProjects) {
        this.ownedProjects = ownedProjects;
    }

    public Set<Issue> getAssignedIssues() {
        return assignedIssues;
    }

    public void setAssignedIssues(Set<Issue> assignedIssues) {
        this.assignedIssues = assignedIssues;
    }

    public Set<Issue> getReportedIssues() {
        return reportedIssues;
    }

    public void setReportedIssues(Set<Issue> reportedIssues) {
        this.reportedIssues = reportedIssues;
    }

    public Set<Project> getMemberProjects() {
        return memberProjects;
    }

    public void setMemberProjects(Set<Project> memberProjects) {
        this.memberProjects = memberProjects;
    }
}
