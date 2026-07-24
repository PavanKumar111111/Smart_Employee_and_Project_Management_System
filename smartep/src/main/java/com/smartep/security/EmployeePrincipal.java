package com.smartep.security;

import com.smartep.employee.Employee;
import com.smartep.employee.Role;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.Collections;
import java.util.UUID;

public class EmployeePrincipal implements UserDetails {

    private final UUID id;
    private final String email;
    private final String password;
    private final String name;
    private final Role role;

    public EmployeePrincipal(Employee employee) {
        this.id = employee.getId();
        this.email = employee.getEmail();
        this.password = employee.getPassword();
        this.name = employee.getName();
        this.role = employee.getRole() != null ? employee.getRole() : Role.EMPLOYEE;
    }

    public UUID getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public Role getRole() {
        return role;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return Collections.singletonList(new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_" + role.name()));
    }

    @Override
    public String getPassword() {
        return password;
    }

    @Override
    public String getUsername() {
        return email; // Use email as username
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return true;
    }
}
