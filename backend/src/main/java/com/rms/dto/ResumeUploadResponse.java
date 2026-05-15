package com.rms.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ResumeUploadResponse {
    private String id;
    private String candidateId;
    private String candidateName;
    private String fileName;
    private String signedUrl;
    private String storagePath;
    private String status;
    /** Recruitment pipeline status */
    private String resumeStatus;
    /** Job role this person is being recruited for */
    private String recruitedFor;
    private LocalDateTime uploadedAt;
    private String uploadedByName;
    private String message;
}
