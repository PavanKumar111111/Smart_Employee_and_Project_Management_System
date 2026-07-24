package com.smartep.employee;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface EmployeeRepository extends JpaRepository<Employee, UUID> {

    Optional<Employee> findByEmail(String email);

    boolean existsByEmail(String email);

    Page<Employee> findByRole(Role role, Pageable pageable);
    
    @Query("SELECT u FROM Employee u WHERE LOWER(u.name) LIKE LOWER(CONCAT('%', :query, '%')) " +
    	       "OR LOWER(u.email) LIKE LOWER(CONCAT('%', :query, '%'))")
    List<Employee> searchByNameOrEmail(@Param("query") String query);

    @Query("SELECT u FROM Employee u WHERE u.role = :role AND (LOWER(u.name) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(u.email) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(u.department) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Employee> findEmployees(@Param("role") Role role, @Param("search") String search, Pageable pageable);
}
