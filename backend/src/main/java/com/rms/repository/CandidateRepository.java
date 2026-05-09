package com.rms.repository;

import com.rms.model.Candidate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface CandidateRepository extends JpaRepository<Candidate, UUID>,
        JpaSpecificationExecutor<Candidate> {

    // Find active candidates with pagination
    Page<Candidate> findByStatus(String status, Pageable pageable);

    // JPQL: search by keyword across name, email, jobRole
    @Query("SELECT c FROM Candidate c WHERE c.status = 'ACTIVE' AND (" +
           "LOWER(c.name) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(c.email) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(c.jobRole) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    List<Candidate> findByKeyword(@Param("keyword") String keyword);

    // JPQL: search by skill substring in comma-separated TEXT
    @Query("SELECT c FROM Candidate c WHERE c.status = 'ACTIVE' AND " +
           "LOWER(c.skills) LIKE LOWER(CONCAT('%', :skill, '%'))")
    List<Candidate> findBySkillsContaining(@Param("skill") String skill);

    // JPQL: search by job role
    @Query("SELECT c FROM Candidate c WHERE c.status = 'ACTIVE' AND " +
           "LOWER(c.jobRole) LIKE LOWER(CONCAT('%', :role, '%'))")
    List<Candidate> findByJobRole(@Param("role") String role);

    // Combined active candidates — filtering is done in SearchService to avoid
    // PostgreSQL SQLState 42883 (undefined function) caused by :param IS NULL on typed params.
    @Query("SELECT c FROM Candidate c WHERE c.status = 'ACTIVE' ORDER BY c.createdAt DESC")
    List<Candidate> findAllActive();

    @Query("SELECT c FROM Candidate c WHERE c.status = 'ACTIVE' AND c.resumeUrl IS NOT NULL ORDER BY c.createdAt DESC")
    List<Candidate> findAllActiveWithResumes();
}
