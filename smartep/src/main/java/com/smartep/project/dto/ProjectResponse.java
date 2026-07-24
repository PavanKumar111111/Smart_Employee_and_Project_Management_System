package com.smartep.project.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public class ProjectResponse {

    private UUID id;
    private String name;
    private String key;
    private String description;
    private UUID ownerId;
    private String ownerName;
    private long issueCount;
    private String status;
    private String priority;
    private java.time.LocalDate deadline;
    private LocalDateTime createdAt;

    public ProjectResponse(UUID id, String name, String key, String description, UUID ownerId, String ownerName,
            long issueCount, String status, String priority, java.time.LocalDate deadline, LocalDateTime createdAt) {
        this.id = id;
        this.name = name;
        this.key = key;
        this.description = description;
        this.ownerId = ownerId;
        this.ownerName = ownerName;
        this.issueCount = issueCount;
        this.status = status;
        this.priority = priority;
        this.deadline = deadline;
        this.createdAt = createdAt;
    }

    // Getters and Setters
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

    public UUID getOwnerId() {
        return ownerId;
    }

    public void setOwnerId(UUID ownerId) {
        this.ownerId = ownerId;
    }

    public String getOwnerName() {
        return ownerName;
    }

    public void setOwnerName(String ownerName) {
        this.ownerName = ownerName;
    }

    public long getIssueCount() {
        return issueCount;
    }

    public void setIssueCount(long issueCount) {
        this.issueCount = issueCount;
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
}
