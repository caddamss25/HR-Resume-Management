package com.rms.service;

import com.rms.dto.CandidateDTO;
import com.rms.model.Candidate;
import com.rms.repository.CandidateRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.NoSuchElementException;
import java.util.UUID;

@Service
public class CandidateService {

    @Autowired
    private CandidateRepository candidateRepository;

    @Autowired
    private ResumeService resumeService;

    public Page<CandidateDTO> getAllCandidates(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return candidateRepository.findByStatus("ACTIVE", pageable)
                .map(this::toDTO);
    }

    @Transactional(readOnly = true)
    public CandidateDTO getCandidateById(UUID id) {
        Candidate candidate = candidateRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Candidate not found: " + id));
        return toDTOWithResumes(candidate);
    }

    @Transactional
    public CandidateDTO createCandidate(CandidateDTO dto) {
        if (dto.getEmail() != null &&
            candidateRepository.findAll().stream()
                .anyMatch(c -> c.getEmail() != null && c.getEmail().equals(dto.getEmail()))) {
            throw new IllegalArgumentException("Email already in use: " + dto.getEmail());
        }
        Candidate candidate = fromDTO(dto);
        return toDTO(candidateRepository.save(candidate));
    }

    @Transactional
    public CandidateDTO updateCandidate(UUID id, CandidateDTO dto) {
        Candidate candidate = candidateRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Candidate not found: " + id));

        if (dto.getName() != null) candidate.setName(dto.getName());
        if (dto.getEmail() != null) candidate.setEmail(dto.getEmail());
        if (dto.getPhone() != null) candidate.setPhone(dto.getPhone());
        if (dto.getSkills() != null) candidate.setSkills(dto.getSkills());
        if (dto.getExperienceYears() != null) candidate.setExperienceYears(dto.getExperienceYears());
        if (dto.getJobRole() != null) candidate.setJobRole(dto.getJobRole());
        if (dto.getRecruitmentStatus() != null) candidate.setRecruitmentStatus(dto.getRecruitmentStatus());
        if (dto.getSummary() != null) candidate.setSummary(dto.getSummary());
        if (dto.getStatus() != null) candidate.setStatus(dto.getStatus());

        return toDTO(candidateRepository.save(candidate));
    }

    @Transactional
    public void deleteCandidate(UUID id) {
        Candidate candidate = candidateRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Candidate not found: " + id));
        
        // 1. Delete resume file from Cloudinary if it exists
        if (candidate.getResumeStoragePath() != null) {
            resumeService.deleteFromCloudinary(candidate.getResumeStoragePath());
        }
        
        // 2. Perform hard delete
        candidateRepository.delete(candidate);
    }

    @Transactional
    public CandidateDTO updateRecruitmentStatus(UUID id, String recruitmentStatus) {
        Candidate candidate = candidateRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Candidate not found: " + id));
        candidate.setRecruitmentStatus(recruitmentStatus);
        return toDTO(candidateRepository.save(candidate));
    }

    public long countActive() {
        return candidateRepository.findByStatus("ACTIVE", PageRequest.of(0, 1)).getTotalElements();
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

    private Candidate fromDTO(CandidateDTO dto) {
        return Candidate.builder()
                .name(dto.getName())
                .email(dto.getEmail())
                .phone(dto.getPhone())
                .skills(dto.getSkills() != null ? dto.getSkills() : List.of())
                .experienceYears(dto.getExperienceYears())
                .jobRole(dto.getJobRole())
                .status("ACTIVE")
                .build();
    }
}
