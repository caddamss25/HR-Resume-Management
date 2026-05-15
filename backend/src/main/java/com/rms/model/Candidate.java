package com.rms.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.GenericGenerator;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "candidates")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Candidate {

    @Id
    @Column(length = 36, updatable = false, nullable = false)
    private String id;

    @Column(length = 100, nullable = false)
    private String name;

    @Column(length = 100, unique = true)
    private String email;

    @Column(length = 20)
    private String phone;

    /**
     * Skills stored as comma-separated TEXT in DB.
     * Converted to/from List<String> via StringListConverter.
     */
    @Convert(converter = com.rms.config.StringListConverter.class)
    @Column(columnDefinition = "TEXT")
    @Builder.Default
    private List<String> skills = new ArrayList<>();

    @Column(name = "experience_years")
    private Integer experienceYears;

    @Column(name = "job_role", length = 100)
    private String jobRole;

    @Column(length = 20)
    @Builder.Default
    private String status = "ACTIVE";

    /**
     * HR recruitment pipeline status:
     * APPLIED | UNDER_REVIEW | SHORTLISTED | INTERVIEW_SCHEDULED | SELECTED | REJECTED | ON_HOLD
     */
    @Column(name = "recruitment_status", length = 30)
    @Builder.Default
    private String recruitmentStatus = "APPLIED";

    @Column(columnDefinition = "TEXT")
    private String summary;

    @Column(name = "resume_url", columnDefinition = "TEXT")
    private String resumeUrl;

    @Column(name = "resume_file_name", length = 255)
    private String resumeFileName;

    @Column(name = "resume_storage_path", columnDefinition = "TEXT")
    private String resumeStoragePath;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
