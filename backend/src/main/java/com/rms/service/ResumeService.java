package com.rms.service;

import com.cloudinary.Cloudinary;
import com.rms.dto.BulkUploadResponse;
import com.rms.dto.ResumeUploadResponse;
import com.rms.model.Candidate;
import com.rms.model.User;
import com.rms.repository.CandidateRepository;
import com.rms.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.*;

@Service
public class ResumeService {

    private static final Logger logger = LoggerFactory.getLogger(ResumeService.class);

    private static final Set<String> ALLOWED_EXTENSIONS =
            Set.of(".pdf", ".doc", ".docx");

    @Autowired private CandidateRepository candidateRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private PasswordEncoder passwordEncoder;
    @Autowired private Cloudinary cloudinary;
    @Autowired private JdbcTemplate jdbcTemplate;

    // Thread pool for parallel uploads
    private final ExecutorService uploadExecutor = Executors.newFixedThreadPool(10);
    
    // Track active bulk jobs: JobID -> List of Futures
    private final Map<UUID, List<CompletableFuture<?>>> activeJobs = new ConcurrentHashMap<>();

    private boolean fileExistsInStorage(String storagePath) {
        try {
            if (storagePath == null || storagePath.isBlank()) return false;
            String clean = storagePath.trim();
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

    public String buildPublicUrl(String storagePath) {
        if (storagePath == null || storagePath.isBlank()) return null;
        String clean = storagePath.trim();
        if (clean.startsWith("resumes/")) clean = clean.substring("resumes/".length());
        clean = clean.replaceAll("^/+", "").replaceAll("//+", "/");
        if (clean.isBlank()) return null;
        return cloudinary.url().secure(true).resourceType("raw").generate(clean);
    }

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
            candidate = createCandidateFromFile(file, resumeStatus, recruitedFor, candidateNotes);
            candidateId = candidate.getId();
        }

        User uploader = userRepository.findByEmail(uploaderEmail)
                .orElseThrow(() -> new NoSuchElementException("User not found: " + uploaderEmail));

        validateFile(file);

        String storagePath = buildStoragePath(candidateId, file.getOriginalFilename());
        String publicUrl = uploadToCloudinary(file, storagePath);

        // Update candidate with resume info using raw JDBC execute
        String sql = "UPDATE candidates SET resume_url = ?, resume_file_name = ?, resume_storage_path = ?, recruitment_status = ?, job_role = ?, summary = ? WHERE id = ?";
        jdbcTemplate.execute((java.sql.Connection conn) -> {
            try (java.sql.PreparedStatement ps = conn.prepareStatement(sql)) {
                ps.setString(1, publicUrl);
                ps.setString(2, file.getOriginalFilename());
                ps.setString(3, storagePath);
                ps.setString(4, resumeStatus != null ? resumeStatus : candidate.getRecruitmentStatus());
                ps.setString(5, recruitedFor != null ? recruitedFor : candidate.getJobRole());
                ps.setString(6, candidateNotes != null ? candidateNotes : candidate.getSummary());
                ps.setString(7, candidate.getId().toString());
                ps.execute();
            }
            return null;
        });

        // Refresh candidate from DB to return accurate response
        candidate = candidateRepository.findById(candidateId).orElse(candidate);
        
        return toResponse(candidate, uploader);
    }

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

        List<CompletableFuture<ProcessResult>> futures = new ArrayList<>();
        for (MultipartFile file : files) {
            futures.add(CompletableFuture.supplyAsync(() -> {
                if (!activeJobs.containsKey(jobId)) {
                    return ProcessResult.fail("UPLOAD_CANCELLED");
                }
                return processSingleFile(file, sharedCandidate, uploader, resumeStatus, recruitedFor, candidateNotes);
            }, uploadExecutor));
        }

        activeJobs.put(jobId, new ArrayList<>(futures));

        try {
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

            return BulkUploadResponse.builder()
                    .totalFiles(files.length)
                    .successCount(uploaded.size())
                    .failureCount(errors.size())
                    .uploaded(uploaded)
                    .errors(errors)
                    .message("Bulk upload complete")
                    .jobId(jobId.toString())
                    .build();
        } finally {
            activeJobs.remove(jobId);
        }
    }

    private ProcessResult processSingleFile(
            MultipartFile file, Candidate sharedCandidate, User uploader,
            String resumeStatus, String recruitedFor, String notes) {
        
        if (file.isEmpty()) return ProcessResult.fail("Skipped empty file: " + file.getOriginalFilename());

        try {
            validateFile(file);
            Candidate currentCandidate;
            synchronized(this) {
                currentCandidate = sharedCandidate != null ? sharedCandidate : createCandidateFromFile(file, resumeStatus, recruitedFor, notes);
            }

            String storagePath = buildStoragePath(currentCandidate.getId(), file.getOriginalFilename());
            String publicUrl = uploadToCloudinary(file, storagePath);

            String sql = "UPDATE candidates SET resume_url = ?, resume_file_name = ?, resume_storage_path = ?, recruitment_status = ?, job_role = ? WHERE id = ?";
            jdbcTemplate.execute((java.sql.Connection conn) -> {
                try (java.sql.PreparedStatement ps = conn.prepareStatement(sql)) {
                    ps.setString(1, publicUrl);
                    ps.setString(2, file.getOriginalFilename());
                    ps.setString(3, storagePath);
                    ps.setString(4, resumeStatus != null ? resumeStatus : currentCandidate.getRecruitmentStatus());
                    ps.setString(5, recruitedFor != null ? recruitedFor : currentCandidate.getJobRole());
                    ps.setString(6, currentCandidate.getId().toString());
                    ps.execute();
                }
                return null;
            });

            currentCandidate = candidateRepository.findById(currentCandidate.getId()).orElse(currentCandidate);
            return ProcessResult.ok(toResponse(currentCandidate, uploader));

        } catch (Exception e) {
            return ProcessResult.fail(file.getOriginalFilename() + ": " + e.getMessage());
        }
    }

    private Candidate createCandidateFromFile(MultipartFile file, String status, String role, String notes) {
        String id = UUID.randomUUID().toString();
        String name = file.getOriginalFilename();
        if (name != null && name.lastIndexOf('.') > 0) name = name.substring(0, name.lastIndexOf('.'));
        
        String sql = "INSERT INTO candidates (id, name, status, recruitment_status, summary, job_role, created_at) VALUES (?, ?, ?, ?, ?, ?, datetime('now'))";
        jdbcTemplate.execute((java.sql.Connection conn) -> {
            try (java.sql.PreparedStatement ps = conn.prepareStatement(sql)) {
                ps.setString(1, id);
                ps.setString(2, name);
                ps.setString(3, "ACTIVE");
                ps.setString(4, status != null ? status : "APPLIED");
                ps.setString(5, notes);
                ps.setString(6, role);
                ps.execute();
            }
            return null;
        });
        return candidateRepository.findById(UUID.fromString(id)).orElseThrow();
    }

    public ResumeUploadResponse updateResumeStatus(UUID id, String resumeStatus, String recruitedFor) {
        String sql = "UPDATE candidates SET recruitment_status = COALESCE(?, recruitment_status), job_role = COALESCE(?, job_role) WHERE id = ?";
        jdbcTemplate.execute((java.sql.Connection conn) -> {
            try (java.sql.PreparedStatement ps = conn.prepareStatement(sql)) {
                ps.setString(1, resumeStatus);
                ps.setString(2, recruitedFor);
                ps.setString(3, id.toString());
                ps.execute();
            }
            return null;
        });
        return toResponse(candidateRepository.findById(id).orElseThrow(), null);
    }

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

    public List<ResumeUploadResponse> getAllWithFreshSignedUrls() {
        return getAllResumes();
    }

    public void deleteResume(UUID id, String adminPassword, String requestUserEmail) {
        User requestUser = userRepository.findByEmail(requestUserEmail).orElseThrow();
        if (!passwordEncoder.matches(adminPassword, requestUser.getPassword())) throw new SecurityException("Incorrect password");
        
        Candidate candidate = candidateRepository.findById(id).orElseThrow();
        if (candidate.getResumeStoragePath() != null) deleteFromCloudinary(candidate.getResumeStoragePath());
        
        jdbcTemplate.execute("DELETE FROM candidates WHERE id = '" + id + "'");
    }

    public Map<String, Object> bulkDelete(List<UUID> candidateIds, String adminPassword, String requestUserEmail) {
        User requestUser = userRepository.findByEmail(requestUserEmail).orElseThrow();
        if (!passwordEncoder.matches(adminPassword, requestUser.getPassword())) throw new SecurityException("Incorrect password");

        int deleted = 0;
        for (UUID id : candidateIds) {
            try {
                Candidate c = candidateRepository.findById(id).orElse(null);
                if (c != null) {
                    if (c.getResumeStoragePath() != null) deleteFromCloudinary(c.getResumeStoragePath());
                    jdbcTemplate.execute("DELETE FROM candidates WHERE id = '" + id + "'");
                    deleted++;
                }
            } catch (Exception e) {}
        }
        return Map.of("deleted", deleted, "message", deleted + " candidate(s) deleted");
    }

    public Map<String, Object> purgeOrphanedRecords(String adminPassword, String requestUserEmail) {
        // Simple mock response or implement similar to above if needed
        return Map.of("message", "Purge not implemented in JDBC mode yet");
    }

    private String buildStoragePath(UUID pathId, String originalFilename) {
        String timestamp = String.valueOf(Instant.now().toEpochMilli());
        String safeFileName = (originalFilename != null ? originalFilename : "file").replaceAll("[^a-zA-Z0-9._-]", "_");
        return pathId + "/" + timestamp + "_" + safeFileName;
    }

    private void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) throw new IllegalArgumentException("File is empty");
        String name = file.getOriginalFilename() != null ? file.getOriginalFilename().toLowerCase() : "";
        if (ALLOWED_EXTENSIONS.stream().noneMatch(name::endsWith)) throw new IllegalArgumentException("Only PDF, DOC, DOCX allowed");
    }

    private String uploadToCloudinary(MultipartFile file, String path) throws IOException {
        Map<String, Object> options = new HashMap<>();
        options.put("resource_type", "raw");
        options.put("public_id", path);
        Map uploadResult = cloudinary.uploader().upload(file.getBytes(), options);
        return uploadResult.get("secure_url").toString();
    }

    public void deleteFromCloudinary(String path) {
        try {
            if (path == null) return;
            Map<String, Object> options = new HashMap<>();
            options.put("resource_type", "raw");
            cloudinary.uploader().destroy(path, options);
        } catch (Exception e) {}
    }

    private ResumeUploadResponse toResponse(Candidate c, User uploader) {
        return ResumeUploadResponse.builder()
                .id(c.getId())
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

    private static class ProcessResult {
        boolean success;
        ResumeUploadResponse response;
        String error;
        static ProcessResult ok(ResumeUploadResponse r) { ProcessResult res = new ProcessResult(); res.success = true; res.response = r; return res; }
        static ProcessResult fail(String err) { ProcessResult res = new ProcessResult(); res.success = false; res.error = err; return res; }
    }
}
