package com.smartep.employee.dto;

import java.util.UUID;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class EmployeeSummaryResponse {
    private UUID id;
    private String name;
    private String email;
	public EmployeeSummaryResponse(UUID id, String name, String email) {
		super();
		this.id = id;
		this.name = name;
		this.email = email;
	}
    
    
}
