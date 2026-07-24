package com.smartep.project.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public class CreateProjectRequest {

    @NotBlank(message = "Name is required")
    @Size(min = 1, max = 200, message = "Name must be between 1 and 200 characters")
    private String name;

    @NotBlank(message = "Key is required")
    @Size(min = 2, max = 10, message = "Key must be between 2 and 10 characters")
    @Pattern(regexp = "^[A-Z]+$", message = "Key must contain only uppercase letters")
    private String key;

    private String description;
    private String status;
    private String priority;
    private java.time.LocalDate deadline;

    public CreateProjectRequest() {
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

    private java.util.List<java.util.UUID> memberIds;

    public void setDeadline(java.time.LocalDate deadline) {
        this.deadline = deadline;
    }

    public java.util.List<java.util.UUID> getMemberIds() {
        return memberIds;
    }

    public void setMemberIds(java.util.List<java.util.UUID> memberIds) {
        this.memberIds = memberIds;
    }
}
