package com.rms.service;

import com.cloudinary.Cloudinary;
import com.rms.dto.BulkUploadResponse;
import com.rms.dto.ResumeUploadResponse;
import com.rms.model.Candidate;
import com.rms.model.Candidate;
import com.rms.model.User;
import com.rms.repository.CandidateRepository;
import com.rms.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.*;
import java.util.stream.Collectors;

@Service
public class ResumeService {

    private static final Logger logger = LoggerFactory.getLogger(ResumeService.class);

    private static final Set<String> ALLOWED_EXTENSIONS =
            Set.of(".pdf", ".doc", ".docx");

    @Autowired private CandidateRepository candidateRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private PasswordEncoder passwordEncoder;
    @Autowired private Cloudinary cloudinary;

    // Thread pool for parallel uploads
    private final ExecutorService uploadExecutor = Executors.newFixedThreadPool(10);
    
    // Track active bulk jobs: JobID -> List of Futures
    private final Map<UUID, List<CompletableFuture<?>>> activeJobs = new ConcurrentHashMap<>();

    /** 
     * Helper to verify if a file exists in Cloudinary. 
     * Resumes are stored in Cloudinary as 'raw' resources to preserve original formatting.
     */
    private boolean fileExistsInStorage(String storagePath) {
        try {
            if (storagePath == null || storagePath.isBlank()) return false;
            String clean = storagePath.trim();
            // Cleanup path for Cloudinary API lookup
            if (clean.startsWith("resumes/")) clean = clean.substring("resumes/".length());
            clean = clean.replaceAll("^/+", "").replaceAll("//+", "/");
            
            Map<String, Object> options = new HashMap<>();
            options.put("resource_type", "raw");
            cloudinary.api().resource(clean, options);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    /** Public accessor — other services can call this with a storagePath to get the permanent URL. */
    public String buildPublicUrl(String storagePath) {
        if (storagePath == null || storagePath.isBlank()) return null;
        String clean = storagePath.trim();
        // Strip leading bucket prefix if stored by old code
        if (clean.startsWith("resumes/")) clean = clean.substring("resumes/".length());
        clean = clean.replaceAll("^/+", "").replaceAll("//+", "/");
        if (clean.isBlank()) return null;
        return cloudinary.url().secure(true).resourceType("raw").generate(clean);
    }

    // ================================================================
    // SINGLE UPLOAD
    // ================================================================


    public ResumeUploadResponse uploadResume(
            MultipartFile file,
            UUID candidateId,
            String uploaderEmail,
            String resumeStatus,
            String recruitedFor,
            String candidateNotes) throws IOException {

        Candidate candidate;
        if (candidateId != null) {
            candidate = candidateRepository.findById(candidateId).orElse(null);
        } else {
            String originalFileName = file.getOriginalFilename();
            String candidateName = originalFileName != null ? originalFileName : "Unknown Candidate";
            int lastDot = candidateName.lastIndexOf('.');
            if (lastDot > 0) candidateName = candidateName.substring(0, lastDot);
            
            candidate = Candidate.builder()
                    .name(candidateName)
                    .status("ACTIVE")
                    .recruitmentStatus(resumeStatus != null ? resumeStatus : "APPLIED")
                    .summary(candidateNotes)
                    .jobRole(recruitedFor)
                    .build();
            candidate = candidateRepository.save(candidate);
            candidateId = candidate.getId();
        }

        User uploader = userRepository.findByEmail(uploaderEmail)
                .orElseThrow(() -> new NoSuchElementException("User not found: " + uploaderEmail));

        validateFile(file);

        String storagePath = buildStoragePath(candidateId, file.getOriginalFilename());
        String publicUrl = uploadToCloudinary(file, storagePath);

        // Update candidate with resume info
        candidate.setResumeUrl(publicUrl);
        candidate.setResumeFileName(file.getOriginalFilename());
        candidate.setResumeStoragePath(storagePath);
        if (resumeStatus != null) candidate.setRecruitmentStatus(resumeStatus);
        if (recruitedFor != null) candidate.setJobRole(recruitedFor);
        if (candidateNotes != null) candidate.setSummary(candidateNotes);

        Candidate saved = candidateRepository.save(candidate);
        
        logger.info("Resume stored in Cloudinary and Candidate updated: {}", saved.getId());
        logger.info("Cloudinary URL: {}", publicUrl);
        
        return toResponse(saved, uploader);
    }

    // ================================================================
    // BULK UPLOAD — 50+ files at once
    // ================================================================


    public BulkUploadResponse bulkUpload(
            MultipartFile[] files,
            UUID candidateId,
            String uploaderEmail,
            String resumeStatus,
            String recruitedFor,
            String candidateNotes) {
        
        UUID jobId = UUID.randomUUID();
        User uploader = userRepository.findByEmail(uploaderEmail)
                .orElseThrow(() -> new NoSuchElementException("User not found: " + uploaderEmail));
        
        Candidate sharedCandidate = (candidateId != null)
                ? candidateRepository.findById(candidateId).orElse(null)
                : null;

        logger.info("Starting FAST Parallel Bulk Upload [Job: {}] of {} files for {}", jobId, files.length, uploaderEmail);

        // Process files in parallel
        List<CompletableFuture<ProcessResult>> futures = new ArrayList<>();
        for (MultipartFile file : files) {
            futures.add(CompletableFuture.supplyAsync(() -> {
                // CHECK FOR CANCELLATION
                if (!activeJobs.containsKey(jobId)) {
                    return ProcessResult.fail("UPLOAD_CANCELLED");
                }
                return processSingleFile(file, sharedCandidate, uploader, resumeStatus, recruitedFor, candidateNotes);
            }, uploadExecutor));
        }

        activeJobs.put(jobId, new ArrayList<>(futures));

        try {
            // Wait for all to complete
            List<ProcessResult> results = futures.stream()
                    .map(CompletableFuture::join)
                    .toList();

            List<ResumeUploadResponse> uploaded = new ArrayList<>();
            List<String> errors = new ArrayList<>();

            for (ProcessResult res : results) {
                if (res.success) {
                    uploaded.add(res.response);
                } else if (!"UPLOAD_CANCELLED".equals(res.error)) {
                    errors.add(res.error);
                }
            }

            boolean wasCancelled = !activeJobs.containsKey(jobId);

            return BulkUploadResponse.builder()
                    .totalFiles(files.length)
                    .successCount(uploaded.size())
                    .failureCount(errors.size())
                    .uploaded(uploaded)
                    .errors(errors)
                    .message(wasCancelled ? "Upload was cancelled. " + uploaded.size() + " files were saved." : "Fast bulk upload complete")
                    .jobId(jobId.toString())
                    .build();
        } finally {
            activeJobs.remove(jobId);
        }
    }

    public void cancelJob(UUID jobId) {
        List<CompletableFuture<?>> futures = activeJobs.remove(jobId);
        if (futures != null) {
            logger.warn("Cancelling Bulk Upload Job: {}", jobId);
            for (CompletableFuture<?> f : futures) {
                f.cancel(true);
            }
        }
    }

    /**
     * Inner helper class for parallel results
     */
    private static class ProcessResult {
        boolean success;
        ResumeUploadResponse response;
        String error;

        static ProcessResult ok(ResumeUploadResponse r) {
            ProcessResult res = new ProcessResult();
            res.success = true;
            res.response = r;
            return res;
        }

        static ProcessResult fail(String err) {
            ProcessResult res = new ProcessResult();
            res.success = false;
            res.error = err;
            return res;
        }
    }

    private ProcessResult processSingleFile(
            MultipartFile file, Candidate sharedCandidate, User uploader,
            String resumeStatus, String recruitedFor, String notes) {
        
        if (file.isEmpty()) return ProcessResult.fail("Skipped empty file: " + file.getOriginalFilename());

        try {
            validateFile(file);
            
            // Note: DB operations inside parallel threads should be handled carefully.
            // In Spring, @Transactional on the caller (bulkUpload) might not propagate to supplyAsync threads.
            // We'll create the candidate synchronously or use a synchronized block if needed.
            Candidate currentCandidate;
            synchronized(this) {
                currentCandidate = sharedCandidate != null ? sharedCandidate : createCandidateFromFile(file, resumeStatus, recruitedFor, notes);
            }

            String storagePath = buildStoragePath(currentCandidate.getId(), file.getOriginalFilename());
            String publicUrl = uploadToCloudinary(file, storagePath);

            currentCandidate.setResumeUrl(publicUrl);
            currentCandidate.setResumeFileName(file.getOriginalFilename());
            currentCandidate.setResumeStoragePath(storagePath);
            if (resumeStatus != null) currentCandidate.setRecruitmentStatus(resumeStatus);
            if (recruitedFor != null) currentCandidate.setJobRole(recruitedFor);

            Candidate saved = candidateRepository.save(currentCandidate);
            logger.info("Parallel upload OK: {}", file.getOriginalFilename());
            
            return ProcessResult.ok(toResponse(saved, uploader));

        } catch (Exception e) {
            String msg = file.getOriginalFilename() + ": " + e.getMessage();
            logger.error("Parallel upload error — {}", msg);
            return ProcessResult.fail(msg);
        }
    }

    private Candidate createCandidateFromFile(MultipartFile file, String status, String role, String notes) {
        String originalFileName = file.getOriginalFilename();
        String candidateName = originalFileName != null ? originalFileName : "Unknown Candidate";
        int lastDot = candidateName.lastIndexOf('.');
        if (lastDot > 0) candidateName = candidateName.substring(0, lastDot);
        
        Candidate candidate = Candidate.builder()
                .name(candidateName)
                .status("ACTIVE")
                .recruitmentStatus(status != null ? status : "APPLIED")
                .summary(notes)
                .jobRole(role)
                .build();
        return candidateRepository.save(candidate);
    }

    // ================================================================
    // UPDATE RESUME STATUS
    // ================================================================


    public ResumeUploadResponse updateResumeStatus(UUID id, String resumeStatus, String recruitedFor) {
        Candidate candidate = candidateRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Candidate not found: " + id));
        if (resumeStatus != null) candidate.setRecruitmentStatus(resumeStatus);
        if (recruitedFor != null) candidate.setJobRole(recruitedFor);
        return toResponse(candidateRepository.save(candidate), null);
    }

    // ================================================================
    // GET RESUMES — public URLs are instant, no regeneration needed
    // ================================================================


    public List<ResumeUploadResponse> getAllResumes() {
        return candidateRepository.findAll().stream()
                .filter(c -> c.getResumeUrl() != null)
                .map(c -> toResponse(c, null)).toList();
    }


    public ResumeUploadResponse getResumeById(UUID id) {
        Candidate candidate = candidateRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Candidate not found: " + id));
        return toResponse(candidate, null);
    }


    public String getPublicDownloadUrl(UUID id) {
        Candidate candidate = candidateRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Candidate not found: " + id));
        if (candidate.getResumeUrl() == null || candidate.getResumeUrl().isBlank()) {
            throw new IllegalStateException("Candidate has no resume URL.");
        }
        return candidate.getResumeUrl();
    }


    public List<ResumeUploadResponse> getRecentResumes(int count) {
        return candidateRepository.findAll().stream()
                .filter(c -> c.getResumeUrl() != null)
                .sorted(Comparator.comparing(Candidate::getCreatedAt).reversed())
                .limit(count)
                .map(c -> toResponse(c, null)).toList();
    }


    public List<ResumeUploadResponse> searchByFileName(String fileName) {
        if (fileName == null || fileName.isBlank()) return getAllResumes();
        return candidateRepository.findAll().stream()
                .filter(c -> c.getResumeFileName() != null && c.getResumeFileName().toLowerCase().contains(fileName.toLowerCase()))
                .map(c -> toResponse(c, null)).toList();
    }


    public long countActive() {
        return candidateRepository.count();
    }

    // ================================================================
    // GET ALL WITH PUBLIC URLS (for bulk delete page)
    // ================================================================


    public List<ResumeUploadResponse> getAllWithFreshSignedUrls() {
        return getAllResumes();
    }

    // ================================================================
    // SINGLE DELETE
    // ================================================================


    public void deleteResume(UUID id, String adminPassword, String requestUserEmail) {
        User requestUser = userRepository.findByEmail(requestUserEmail)
                .orElseThrow(() -> new NoSuchElementException("User not found"));
        if (!passwordEncoder.matches(adminPassword, requestUser.getPassword())) {
            throw new SecurityException("Incorrect password. Deletion denied.");
        }
        Candidate candidate = candidateRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Candidate not found: " + id));
        
        if (candidate.getResumeStoragePath() != null) {
            deleteFromCloudinary(candidate.getResumeStoragePath());
        }
        
        candidateRepository.delete(candidate);
        
        logger.info("Candidate and associated resume deleted: {} by {}", id, requestUserEmail);
    }

    // ================================================================
    // BULK DELETE (password-protected)
    // ================================================================


    public Map<String, Object> bulkDelete(List<UUID> candidateIds, String adminPassword, String requestUserEmail) {
        User requestUser = userRepository.findByEmail(requestUserEmail)
                .orElseThrow(() -> new NoSuchElementException("User not found"));
        if (!passwordEncoder.matches(adminPassword, requestUser.getPassword())) {
            throw new SecurityException("Incorrect password. Bulk deletion denied.");
        }

        int deleted = 0;
        int failed = 0;
        for (UUID id : candidateIds) {
            try {
                Candidate candidate = candidateRepository.findById(id).orElse(null);
                if (candidate != null) {
                    if (candidate.getResumeStoragePath() != null) {
                        deleteFromCloudinary(candidate.getResumeStoragePath());
                    }
                    candidateRepository.delete(candidate);
                    deleted++;
                }
            } catch (Exception e) {
                logger.error("Failed to delete candidate {}: {}", id, e.getMessage());
                failed++;
            }
        }
        logger.info("Bulk candidate and resume deletion by {}: {} successful, {} failed", requestUserEmail, deleted, failed);
        return Map.of("deleted", deleted, "failed", failed,
                "message", deleted + " candidate(s) and associated resume(s) deleted successfully");
    }

    // ================================================================
    // PURGE ORPHANED RECORDS
    // With public URLs we check existence by doing a HEAD request
    // ================================================================


    public Map<String, Object> purgeOrphanedRecords(String adminPassword, String requestUserEmail) {
        User requestUser = userRepository.findByEmail(requestUserEmail)
                .orElseThrow(() -> new NoSuchElementException("User not found"));
        if (!passwordEncoder.matches(adminPassword, requestUser.getPassword())) {
            throw new SecurityException("Incorrect password. Purge denied.");
        }

        List<Candidate> all = candidateRepository.findAll();

        int purged = 0;
        int kept = 0;
        List<String> purgedFiles = new ArrayList<>();

        for (Candidate c : all) {
            if (c.getResumeUrl() == null) continue;
            
            if (c.getResumeStoragePath() == null || c.getResumeStoragePath().isBlank()) {
                c.setResumeUrl(null);
                candidateRepository.save(c);
                purged++;
                purgedFiles.add(c.getName() + " (no path)");
                continue;
            }
            
            boolean exists = fileExistsInStorage(c.getResumeStoragePath());
            if (!exists) {
                c.setResumeUrl(null);
                c.setResumeFileName(null);
                c.setResumeStoragePath(null);
                candidateRepository.save(c);
                purged++;
                purgedFiles.add(c.getResumeFileName());
            } else {
                kept++;
            }
        }

        logger.info("Purge complete by {}: {} purged, {} kept", requestUserEmail, purged, kept);
        return Map.of(
                "purged", purged, "kept", kept, "purgedFiles", purgedFiles,
                "message", purged + " orphaned resume link(s) removed. " + kept + " valid record(s) kept."
        );
    }

    // ================================================================
    // PRIVATE HELPERS
    // ================================================================

    private String buildStoragePath(UUID pathId, String originalFilename) {
        String timestamp = String.valueOf(Instant.now().toEpochMilli());
        String safeFileName = (originalFilename != null ? originalFilename : "file")
                .replaceAll("[^a-zA-Z0-9._-]", "_");
        return pathId + "/" + timestamp + "_" + safeFileName;
    }

    private void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty())
            throw new IllegalArgumentException("File is empty");
        String name = file.getOriginalFilename() != null ? file.getOriginalFilename().toLowerCase() : "";
        boolean valid = ALLOWED_EXTENSIONS.stream().anyMatch(name::endsWith);
        if (!valid) throw new IllegalArgumentException(
                "Only PDF, DOC, DOCX allowed. Got: " + file.getOriginalFilename());
    }

    private String uploadToCloudinary(MultipartFile file, String path) throws IOException {
        Map<String, Object> options = new HashMap<>();
        options.put("resource_type", "raw");
        options.put("public_id", path);
        try {
            Map uploadResult = cloudinary.uploader().upload(file.getBytes(), options);
            logger.info("Cloudinary upload OK: {}", path);
            return uploadResult.get("secure_url").toString();
        } catch (Exception e) {
            logger.error("Cloudinary upload failed for {}: {}", path, e.getMessage());
            throw new RuntimeException("Storage upload failed: " + e.getMessage());
        }
    }

    public void deleteFromCloudinary(String path) {
        try {
            if (path == null || path.isBlank()) return;
            String clean = path.startsWith("resumes/") ? path.substring("resumes/".length()) : path;
            Map<String, Object> options = new HashMap<>();
            options.put("resource_type", "raw");
            options.put("invalidate", true);
            cloudinary.uploader().destroy(clean, options);
            logger.info("Cloudinary delete OK: {}", clean);
        } catch (Exception e) {
            logger.error("Failed to delete from Cloudinary: {}", e.getMessage());
        }
    }

    private ResumeUploadResponse toResponse(Candidate c, User uploader) {
        return ResumeUploadResponse.builder()
                .id(c.getId()) // Use candidate ID as resume ID for simplicity
                .candidateId(c.getId())
                .candidateName(c.getName())
                .fileName(c.getResumeFileName())
                .signedUrl(c.getResumeUrl())
                .storagePath(c.getResumeStoragePath())
                .status(c.getStatus())
                .resumeStatus(c.getRecruitmentStatus())
                .recruitedFor(c.getJobRole())
                .uploadedAt(c.getCreatedAt())
                .uploadedByName(uploader != null ? uploader.getName() : null)
                .build();
    }
}
