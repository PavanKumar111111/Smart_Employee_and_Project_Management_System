package com.smartep.project.dto;

import java.util.UUID;

import jakarta.validation.constraints.NotNull;



public class AddMemberRequest {
	@NotNull
    private UUID employeeId;

	public UUID getUserId() {
		return employeeId;
	}

	public void setUserId(UUID employeeId) {
		this.employeeId = employeeId;
	}
	
	
}
