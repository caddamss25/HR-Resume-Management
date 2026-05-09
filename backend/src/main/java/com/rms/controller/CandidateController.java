package com.rms.controller;

import com.rms.dto.CandidateDTO;
import com.rms.service.CandidateService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.NoSuchElementException;
import java.util.UUID;

@RestController
@RequestMapping("/api/candidates")
public class CandidateController {

    @Autowired
    private CandidateService candidateService;

    // GET /api/candidates?page=0&size=10
    @GetMapping
    public ResponseEntity<Page<CandidateDTO>> getAllCandidates(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(candidateService.getAllCandidates(page, size));
    }

    // GET /api/candidates/{id}
    @GetMapping("/{id}")
    public ResponseEntity<?> getCandidateById(@PathVariable UUID id) {
        try {
            return ResponseEntity.ok(candidateService.getCandidateById(id));
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        }
    }

    // POST /api/candidates (RECRUITER, ADMIN)
    @PostMapping
    @PreAuthorize("hasAnyRole('RECRUITER','ADMIN')")
    public ResponseEntity<?> createCandidate(@Valid @RequestBody CandidateDTO dto) {
        try {
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(candidateService.createCandidate(dto));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", e.getMessage()));
        }
    }

    // PUT /api/candidates/{id} (RECRUITER, MANAGER, ADMIN)
    @PutMapping("/{id}")
    public ResponseEntity<?> updateCandidate(@PathVariable UUID id, @RequestBody CandidateDTO dto) {
        try {
            return ResponseEntity.ok(candidateService.updateCandidate(id, dto));
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        }
    }

    // DELETE /api/candidates/{id} (ADMIN only — soft delete)
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteCandidate(@PathVariable UUID id) {
        try {
            candidateService.deleteCandidate(id);
            return ResponseEntity.ok(Map.of("message", "Candidate and all associated resumes deleted permanently"));
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        }
    }

    // PATCH /api/candidates/{id}/recruitment-status (HR/RECRUITER/ADMIN)
    @PatchMapping("/{id}/recruitment-status")
    public ResponseEntity<?> updateRecruitmentStatus(
            @PathVariable UUID id,
            @RequestParam String status) {
        try {
            return ResponseEntity.ok(candidateService.updateRecruitmentStatus(id, status));
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        }
    }

    // GET /api/candidates/count (for dashboard)
    @GetMapping("/count")
    public ResponseEntity<Map<String, Long>> getCount() {
        return ResponseEntity.ok(Map.of("count", candidateService.countActive()));
    }
}
