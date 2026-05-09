package com.rms.controller;

import com.rms.dto.BulkUploadResponse;
import com.rms.dto.ResumeUploadResponse;
import com.rms.service.ResumeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.UUID;

@RestController
@RequestMapping("/api/resumes")
public class ResumeController {

    @Autowired
    private ResumeService resumeService;

    // ─────────────────────────────────────────────
    // SINGLE UPLOAD
    // ─────────────────────────────────────────────
    @PostMapping("/upload")
    public ResponseEntity<?> uploadResume(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "candidateId", required = false) UUID candidateId,
            @RequestParam(value = "resumeStatus", defaultValue = "APPLIED") String resumeStatus,
            @RequestParam(value = "recruitedFor", required = false) String recruitedFor,
            @RequestParam(value = "candidateNotes", required = false) String candidateNotes,
            @AuthenticationPrincipal UserDetails userDetails) {
        try {
            ResumeUploadResponse response = resumeService.uploadResume(
                    file, candidateId, userDetails.getUsername(), resumeStatus, recruitedFor, candidateNotes);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Upload failed: " + e.getMessage()));
        }
    }

    // ─────────────────────────────────────────────
    // BULK UPLOAD (50+ files at once)
    // ─────────────────────────────────────────────
    @PostMapping("/bulk-upload")
    public ResponseEntity<?> bulkUpload(
            @RequestParam("files") MultipartFile[] files,
            @RequestParam(value = "candidateId", required = false) UUID candidateId,
            @RequestParam(value = "resumeStatus", defaultValue = "APPLIED") String resumeStatus,
            @RequestParam(value = "recruitedFor", required = false) String recruitedFor,
            @RequestParam(value = "candidateNotes", required = false) String candidateNotes,
            @AuthenticationPrincipal UserDetails userDetails) {
        try {
            BulkUploadResponse response = resumeService.bulkUpload(
                    files, candidateId, userDetails.getUsername(), resumeStatus, recruitedFor, candidateNotes);
            return ResponseEntity.status(HttpStatus.MULTI_STATUS).body(response);
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Bulk upload failed: " + e.getMessage()));
        }
    }
    @PostMapping("/bulk-upload/cancel/{jobId}")
    public ResponseEntity<?> cancelBulkUpload(@PathVariable UUID jobId) {
        resumeService.cancelJob(jobId);
        return ResponseEntity.ok(Map.of("message", "Cancellation request sent for job: " + jobId));
    }

    // ─────────────────────────────────────────────
    // GET ALL RESUMES
    // ─────────────────────────────────────────────
    @GetMapping
    public ResponseEntity<List<ResumeUploadResponse>> getAllResumes() {
        return ResponseEntity.ok(resumeService.getAllResumes());
    }

    // ─────────────────────────────────────────────
    // GET ALL WITH FRESH SIGNED URLS (before bulk delete)
    // ─────────────────────────────────────────────
    @GetMapping("/download-all-urls")
    public ResponseEntity<List<ResumeUploadResponse>> getAllDownloadUrls() {
        return ResponseEntity.ok(resumeService.getAllWithFreshSignedUrls());
    }

    // ─────────────────────────────────────────────
    // GET RESUME COUNT (for dashboard)
    // ─────────────────────────────────────────────
    @GetMapping("/count")
    public ResponseEntity<Map<String, Long>> getResumeCount() {
        return ResponseEntity.ok(Map.of("count", resumeService.countActive()));
    }

    // ─────────────────────────────────────────────
    // GET RECENT
    // ─────────────────────────────────────────────
    @GetMapping("/recent")
    public ResponseEntity<List<ResumeUploadResponse>> getRecentResumes(
            @RequestParam(defaultValue = "5") int count) {
        return ResponseEntity.ok(resumeService.getRecentResumes(count));
    }

    // ─────────────────────────────────────────────
    // SEARCH BY FILE NAME
    // ─────────────────────────────────────────────
    @GetMapping("/search")
    public ResponseEntity<List<ResumeUploadResponse>> searchByFileName(
            @RequestParam(required = false) String fileName) {
        return ResponseEntity.ok(resumeService.searchByFileName(fileName));
    }

    // ─────────────────────────────────────────────
    // GET SINGLE
    // ─────────────────────────────────────────────
    @GetMapping("/{id}")
    public ResponseEntity<?> getResumeById(@PathVariable UUID id) {
        try {
            return ResponseEntity.ok(resumeService.getResumeById(id));
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        }
    }

    // ─────────────────────────────────────────────
    // GET FRESH DOWNLOAD URL ON DEMAND
    // Always generates a brand-new signed URL — never stale/expired
    // ─────────────────────────────────────────────
    @GetMapping("/{id}/view")
    public ResponseEntity<?> getFreshViewUrl(@PathVariable UUID id) {
        try {
            String url = resumeService.getPublicDownloadUrl(id);
            return ResponseEntity.ok(Map.of("url", url));
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.GONE).body(Map.of("error", e.getMessage()));
        }
    }

    // ─────────────────────────────────────────────
    // UPDATE STATUS / RECRUITED FOR
    // ─────────────────────────────────────────────
    @PatchMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(
            @PathVariable UUID id,
            @RequestParam(required = false) String resumeStatus,
            @RequestParam(required = false) String recruitedFor) {
        try {
            return ResponseEntity.ok(resumeService.updateResumeStatus(id, resumeStatus, recruitedFor));
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        }
    }

    // ─────────────────────────────────────────────
    // DELETE SINGLE (password-protected)
    // ─────────────────────────────────────────────
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteResume(
            @PathVariable UUID id,
            @RequestParam("password") String password,
            @AuthenticationPrincipal UserDetails userDetails) {
        try {
            resumeService.deleteResume(id, password, userDetails.getUsername());
            return ResponseEntity.ok(Map.of("message", "Resume deleted successfully"));
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", e.getMessage()));
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        }
    }

    // ─────────────────────────────────────────────
    // BULK DELETE (password-protected)
    // Body: { "ids": ["uuid1","uuid2",...], "password": "..." }
    // ─────────────────────────────────────────────
    @DeleteMapping("/bulk-delete")
    public ResponseEntity<?> bulkDelete(
            @RequestBody Map<String, Object> body,
            @AuthenticationPrincipal UserDetails userDetails) {
        try {
            @SuppressWarnings("unchecked")
            List<String> idStrings = (List<String>) body.get("ids");
            String password = (String) body.get("password");

            if (idStrings == null || idStrings.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "No IDs provided"));
            }
            if (password == null || password.isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Password is required"));
            }

            List<UUID> ids = idStrings.stream().map(UUID::fromString).toList();
            Map<String, Object> result = resumeService.bulkDelete(
                    ids, password, userDetails.getUsername());
            return ResponseEntity.ok(result);
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Bulk delete failed: " + e.getMessage()));
        }
    }

    // ─────────────────────────────────────────────
    // PURGE ORPHANED RECORDS (ADMIN — password protected)
    // Removes DB records whose files don't exist in Cloudinary Storage
    // Body: { "password": "..." }
    // ─────────────────────────────────────────────
    @PostMapping("/purge-orphaned")
    public ResponseEntity<?> purgeOrphaned(
            @RequestBody Map<String, Object> body,
            @AuthenticationPrincipal UserDetails userDetails) {
        try {
            String password = (String) body.get("password");
            if (password == null || password.isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Password is required"));
            }
            Map<String, Object> result = resumeService.purgeOrphanedRecords(
                    password, userDetails.getUsername());
            return ResponseEntity.ok(result);
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Purge failed: " + e.getMessage()));
        }
    }
}
