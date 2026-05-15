package com.rms.service;

import com.rms.dto.CandidateDTO;
import com.rms.model.Candidate;
import com.rms.repository.CandidateRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.NoSuchElementException;
import java.util.UUID;

@Service
public class CandidateService {

    @Autowired
    private CandidateRepository candidateRepository;

    @Autowired
    private ResumeService resumeService;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    public Page<CandidateDTO> getAllCandidates(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return candidateRepository.findByStatus("ACTIVE", pageable)
                .map(this::toDTO);
    }

<<<<<<< HEAD
    public CandidateDTO getCandidateById(String id) {
=======
    public CandidateDTO getCandidateById(UUID id) {
>>>>>>> fe0bfdb83fba51afad75c13a67981f2abe261f05
        Candidate candidate = candidateRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Candidate not found: " + id));
        return toDTOWithResumes(candidate);
    }

    public CandidateDTO createCandidate(CandidateDTO dto) {
<<<<<<< HEAD
        final String id = UUID.randomUUID().toString();
        
        String sql = "INSERT INTO candidates (id, name, email, phone, experience_years, job_role, status, recruitment_status, summary, created_at) VALUES (?, ?, ?, ?, ?, ?, 'ACTIVE', ?, ?, datetime('now'))";
=======
        String id = UUID.randomUUID().toString();
        
        String sql = "INSERT INTO candidates (id, name, email, phone, experience_years, job_role, status, recruitment_status, summary, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))";
>>>>>>> fe0bfdb83fba51afad75c13a67981f2abe261f05
        jdbcTemplate.execute((java.sql.Connection conn) -> {
            try (java.sql.PreparedStatement ps = conn.prepareStatement(sql)) {
                ps.setString(1, id);
                ps.setString(2, dto.getName());
                ps.setString(3, dto.getEmail());
                ps.setString(4, dto.getPhone());
                ps.setObject(5, dto.getExperienceYears());
                ps.setString(6, dto.getJobRole());
<<<<<<< HEAD
                ps.setString(7, dto.getRecruitmentStatus() != null ? dto.getRecruitmentStatus() : "APPLIED");
                ps.setString(8, dto.getSummary());
=======
                ps.setString(7, "ACTIVE");
                ps.setString(8, dto.getRecruitmentStatus() != null ? dto.getRecruitmentStatus() : "APPLIED");
                ps.setString(9, dto.getSummary());
>>>>>>> fe0bfdb83fba51afad75c13a67981f2abe261f05
                ps.execute();
            }
            return null;
        });

<<<<<<< HEAD
        return toDTO(candidateRepository.findById(id).orElseThrow());
    }

    public CandidateDTO updateCandidate(String id, CandidateDTO dto) {
=======
        return toDTO(candidateRepository.findById(UUID.fromString(id)).orElseThrow());
    }

    public CandidateDTO updateCandidate(UUID id, CandidateDTO dto) {
>>>>>>> fe0bfdb83fba51afad75c13a67981f2abe261f05
        Candidate c = candidateRepository.findById(id).orElseThrow();
        
        String sql = "UPDATE candidates SET name=?, email=?, phone=?, experience_years=?, job_role=?, recruitment_status=?, summary=?, status=? WHERE id=?";
        jdbcTemplate.execute((java.sql.Connection conn) -> {
            try (java.sql.PreparedStatement ps = conn.prepareStatement(sql)) {
                ps.setString(1, dto.getName() != null ? dto.getName() : c.getName());
                ps.setString(2, dto.getEmail() != null ? dto.getEmail() : c.getEmail());
                ps.setString(3, dto.getPhone() != null ? dto.getPhone() : c.getPhone());
                ps.setObject(4, dto.getExperienceYears() != null ? dto.getExperienceYears() : c.getExperienceYears());
                ps.setString(5, dto.getJobRole() != null ? dto.getJobRole() : c.getJobRole());
                ps.setString(6, dto.getRecruitmentStatus() != null ? dto.getRecruitmentStatus() : c.getRecruitmentStatus());
                ps.setString(7, dto.getSummary() != null ? dto.getSummary() : c.getSummary());
                ps.setString(8, dto.getStatus() != null ? dto.getStatus() : c.getStatus());
<<<<<<< HEAD
                ps.setString(9, id);
=======
                ps.setString(9, id.toString());
>>>>>>> fe0bfdb83fba51afad75c13a67981f2abe261f05
                ps.execute();
            }
            return null;
        });

        return toDTO(candidateRepository.findById(id).orElseThrow());
    }

<<<<<<< HEAD
    public void deleteCandidate(String id) {
=======
    public void deleteCandidate(UUID id) {
>>>>>>> fe0bfdb83fba51afad75c13a67981f2abe261f05
        Candidate candidate = candidateRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Candidate not found: " + id));
        
        if (candidate.getResumeStoragePath() != null) {
            resumeService.deleteFromCloudinary(candidate.getResumeStoragePath());
        }
        
        jdbcTemplate.execute("DELETE FROM candidates WHERE id = '" + id + "'");
    }

<<<<<<< HEAD
    public CandidateDTO updateRecruitmentStatus(String id, String recruitmentStatus) {
=======
    public CandidateDTO updateRecruitmentStatus(UUID id, String recruitmentStatus) {
>>>>>>> fe0bfdb83fba51afad75c13a67981f2abe261f05
        String sql = "UPDATE candidates SET recruitment_status = ? WHERE id = ?";
        jdbcTemplate.execute((java.sql.Connection conn) -> {
            try (java.sql.PreparedStatement ps = conn.prepareStatement(sql)) {
                ps.setString(1, recruitmentStatus);
<<<<<<< HEAD
                ps.setString(2, id);
=======
                ps.setString(2, id.toString());
>>>>>>> fe0bfdb83fba51afad75c13a67981f2abe261f05
                ps.execute();
            }
            return null;
        });
        return toDTO(candidateRepository.findById(id).orElseThrow());
    }

    public long countActive() {
        return candidateRepository.count();
    }

    private CandidateDTO toDTO(Candidate c) {
        return CandidateDTO.builder()
                .id(c.getId())
                .name(c.getName())
                .email(c.getEmail())
                .phone(c.getPhone())
                .skills(c.getSkills())
                .experienceYears(c.getExperienceYears())
                .jobRole(c.getJobRole())
                .status(c.getStatus())
                .recruitmentStatus(c.getRecruitmentStatus())
                .summary(c.getSummary())
                .createdAt(c.getCreatedAt())
                .build();
    }

    private CandidateDTO toDTOWithResumes(Candidate c) {
        CandidateDTO.ResumeDTO resumeDto = null;
        if (c.getResumeUrl() != null) {
            resumeDto = CandidateDTO.ResumeDTO.builder()
                    .id(c.getId())
                    .fileName(c.getResumeFileName())
                    .signedUrl(c.getResumeUrl())
                    .status("ACTIVE")
                    .resumeStatus(c.getRecruitmentStatus())
                    .recruitedFor(c.getJobRole())
                    .uploadedByName(null)
                    .uploadedAt(c.getCreatedAt())
                    .build();
        }
        
        CandidateDTO dto = toDTO(c);
        dto.setResumes(resumeDto != null ? List.of(resumeDto) : List.of());
        return dto;
    }
}
