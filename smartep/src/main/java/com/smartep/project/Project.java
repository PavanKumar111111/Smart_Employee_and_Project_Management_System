package com.smartep.project;

import com.smartep.employee.Employee;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

@Entity
@Table(name = "projects")
public class Project {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false, length = 200)
    private String name;

    @Column(name = "project_key", unique = true, nullable = false, length = 10)
    private String key;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false, length = 50)
    private String priority = "MEDIUM";

    @Column(nullable = false, length = 50)
    private String status = "PLANNED";

    @Column(name = "deadline")
    private java.time.LocalDate deadline;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id", nullable = false)
    private Employee owner;

    @Column(nullable = false)
    private Integer nextIssueNumber = 1;
    
    @ManyToMany
    @JoinTable(
      name = "project_members",
      joinColumns = @JoinColumn(name = "project_id"),
      inverseJoinColumns = @JoinColumn(name = "employee_id")
    )
    private Set<Employee> members = new HashSet<>();

    @OneToMany(mappedBy = "project", cascade = CascadeType.ALL, orphanRemoval = true)
    @com.fasterxml.jackson.annotation.JsonIgnore
    private Set<com.smartep.issue.Issue> projectIssues = new java.util.LinkedHashSet<>();

    public Project() {
    }

    public Project(String name, String key, String description, Employee owner) {
        this.name = name;
        this.key = key;
        this.description = description;
        this.owner = owner;
    }
    
    public Set<Employee> getMembers() {
		return members;
	}

	public void setMembers(Set<Employee> members) {
		this.members = members;
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

    public String getKey() {
        return key;
    }

    public void setKey(String key) {
        this.key = key;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Employee getOwner() {
        return owner;
    }

    public void setOwner(Employee owner) {
        this.owner = owner;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getPriority() {
        return priority;
    }

    public void setPriority(String priority) {
        this.priority = priority;
    }

    public java.time.LocalDate getDeadline() {
        return deadline;
    }

    public void setDeadline(java.time.LocalDate deadline) {
        this.deadline = deadline;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public Integer getNextIssueNumber() {
        return nextIssueNumber;
    }

    public void setNextIssueNumber(Integer nextIssueNumber) {
        this.nextIssueNumber = nextIssueNumber;
    }

    public Set<com.smartep.issue.Issue> getProjectIssues() {
        return projectIssues;
    }

    public void setProjectIssues(Set<com.smartep.issue.Issue> projectIssues) {
        this.projectIssues = projectIssues;
    }
}
