package com.rms.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CandidateDTO {
    private UUID id;

    @NotBlank(message = "Name is required")
    private String name;

    @Email(message = "Invalid email format")
    private String email;

    private String phone;
    private List<String> skills;
    private Integer experienceYears;
    private String jobRole;
    private String status;
    private String recruitmentStatus;
    private String summary;
    private LocalDateTime createdAt;
    private List<ResumeDTO> resumes;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ResumeDTO {
        private UUID id;
        private String fileName;
        private String signedUrl;
        private String status;
        private String resumeStatus;
        private String recruitedFor;
        private String uploadedByName;
        private LocalDateTime uploadedAt;
    }
}
