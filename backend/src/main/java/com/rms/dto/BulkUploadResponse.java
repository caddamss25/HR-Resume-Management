package com.rms.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Response for bulk resume upload operation.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BulkUploadResponse {
    private int totalFiles;
    private int successCount;
    private int failureCount;
    private List<ResumeUploadResponse> uploaded;
    private List<String> errors;
    private String message;
    private String jobId;
}
