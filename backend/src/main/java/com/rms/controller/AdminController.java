package com.rms.controller;

import com.rms.model.User;
import com.rms.service.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    @Autowired
    private AuthService authService;

    /**
     * List all HR users (Recruiters and Managers).
     */
    @GetMapping("/users")
    public ResponseEntity<List<User>> getAllHRUsers() {
        return ResponseEntity.ok(authService.getAllHRUsers());
    }

    /**
     * Delete an HR user by ID.
     */
    @DeleteMapping("/users/{id}")
    public ResponseEntity<?> deleteHRUser(@PathVariable UUID id) {
        try {
            authService.deleteUser(id);
            return ResponseEntity.ok(Map.of("message", "User deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(404).body(Map.of("error", e.getMessage()));
        }
    }
}
