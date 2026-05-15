package com.rms.service;

import com.rms.dto.CandidateDTO;
import com.rms.model.Candidate;
import com.rms.repository.CandidateRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class SearchService {

    @Autowired
    private CandidateRepository candidateRepository;

    @Autowired
    private ResumeService resumeService;

    public List<CandidateDTO> search(String keyword, String skill, String role, Integer minExp, String status) {
        // Normalize nulls and blanks
        String kw = (keyword != null && !keyword.isBlank()) ? keyword.trim() : null;
        String sk = (skill != null && !skill.isBlank()) ? skill.trim() : null;
        String rl = (role != null && !role.isBlank()) ? role.trim() : null;
        String st = (status != null && !status.isBlank()) ? status.trim() : null;

        return candidateRepository.findAllActive()
                .stream()
                .filter(c -> {
                    // Keyword: match name, email, jobRole
                    if (kw != null) {
                        String kwLow = kw.toLowerCase();
                        boolean kwMatch =
                            (c.getName() != null && c.getName().toLowerCase().contains(kwLow)) ||
                            (c.getEmail() != null && c.getEmail().toLowerCase().contains(kwLow)) ||
                            (c.getJobRole() != null && c.getJobRole().toLowerCase().contains(kwLow));
                        if (!kwMatch) return false;
                    }
                    // Skill: match comma-separated skills text
                    if (sk != null) {
                        String skillsStr = c.getSkills() == null ? ""
                            : String.join(",", c.getSkills()).toLowerCase();
                        if (!skillsStr.contains(sk.toLowerCase())) return false;
                    }
                    // Role
                    if (rl != null && c.getJobRole() != null) {
                        if (!c.getJobRole().toLowerCase().contains(rl.toLowerCase())) return false;
                    } else if (rl != null) {
                        return false;
                    }
                    // Min experience
                    if (minExp != null) {
                        if (c.getExperienceYears() == null || c.getExperienceYears() < minExp)
                            return false;
                    }
                    // Recruitment Status
                    if (st != null) {
                        if (c.getRecruitmentStatus() == null || !c.getRecruitmentStatus().equalsIgnoreCase(st))
                            return false;
                    }
                    return true;
                })
                .map(this::toDTOWithResumes)
                .toList();
    }

    private CandidateDTO toDTOWithResumes(Candidate c) {
        CandidateDTO.ResumeDTO resumeDto = null;
        if (c.getResumeUrl() != null) {
            resumeDto = CandidateDTO.ResumeDTO.builder()
                    .id(c.getId()) // Use candidate ID as resume ID
                    .fileName(c.getResumeFileName())
                    .signedUrl(c.getResumeUrl())
                    .status("ACTIVE")
                    .resumeStatus(c.getRecruitmentStatus())
                    .recruitedFor(c.getJobRole())
                    .uploadedByName(null)
                    .uploadedAt(c.getCreatedAt())
                    .build();
        }
        List<CandidateDTO.ResumeDTO> resumes = resumeDto != null ? List.of(resumeDto) : List.of();

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
                .createdAt(c.getCreatedAt())
                .resumes(resumes)
                .build();
    }
}
