package com.smartep.issue;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface IssueRepository extends JpaRepository<Issue, UUID> {
    List<Issue> findByProjectIdOrderByPositionAsc(UUID projectId);

    List<Issue> findByProjectIdAndStatus(UUID projectId, IssueStatus status);

    Optional<Issue> findByIssueKey(String issueKey);

    Long countByProjectIdAndStatus(UUID projectId, IssueStatus status);

    long countByProjectId(UUID projectId);
}
