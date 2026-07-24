package com.smartep.project;

import com.smartep.employee.Employee;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ProjectRepository extends JpaRepository<Project, UUID> {
    List<Project> findByOwner(Employee owner);

    List<Project> findByMembersContaining(Employee member);

    boolean existsByKey(String key);
}
