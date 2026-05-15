package com.rms.service;

import com.rms.dto.LoginRequest;
import com.rms.dto.LoginResponse;
import com.rms.dto.RegisterRequest;
import com.rms.model.User;
import com.rms.repository.UserRepository;
import com.rms.security.JwtUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

<<<<<<< HEAD
=======
import java.time.LocalDateTime;
>>>>>>> fe0bfdb83fba51afad75c13a67981f2abe261f05
import java.util.UUID;

@Service
public class AuthService {

    private static final Logger logger = LoggerFactory.getLogger(AuthService.class);

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private UserDetailsService userDetailsService;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    public LoginResponse register(RegisterRequest request) {
        logger.info("[AUTH] Registering user: {}", request.getEmail());
        
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email already registered: " + request.getEmail());
        }

        final String id = UUID.randomUUID().toString();
        final String name = request.getName();
        final String email = request.getEmail();
        final String password = passwordEncoder.encode(request.getPassword());
<<<<<<< HEAD
        final String role = (request.getRole() != null && !request.getRole().isBlank()) 
                           ? request.getRole() : "HR_RECRUITER";

        try {
            String sql = "INSERT INTO users (id, name, email, password, role) VALUES (?, ?, ?, ?, ?)";
=======
        // Default role is HR_RECRUITER if not specified
        final String role = (request.getRole() != null && !request.getRole().isBlank()) 
                           ? request.getRole() : "HR_RECRUITER";

        logger.info("Registering new user: {} with role: {}", email, role);

        try {
            String sql = "INSERT INTO users (id, name, email, password, role, created_at) VALUES (?, ?, ?, ?, ?, ?)";
>>>>>>> fe0bfdb83fba51afad75c13a67981f2abe261f05
            jdbcTemplate.execute((java.sql.Connection conn) -> {
                try (java.sql.PreparedStatement ps = conn.prepareStatement(sql)) {
                    ps.setString(1, id);
                    ps.setString(2, name);
                    ps.setString(3, email);
                    ps.setString(4, password);
                    ps.setString(5, role);
<<<<<<< HEAD
=======
                    ps.setObject(6, LocalDateTime.now().toString()); // Use ISO string for SQLite
>>>>>>> fe0bfdb83fba51afad75c13a67981f2abe261f05
                    ps.execute();
                }
                return null;
            });
<<<<<<< HEAD
            logger.info("[AUTH] User inserted successfully: {}", email);
        } catch (Exception e) {
            logger.error("[AUTH] FATAL ERROR during registration for {}: {}", email, e.getMessage());
            throw new RuntimeException("Database error: " + e.getMessage());
        }

        User saved = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found after save"));
=======
        } catch (Exception e) {
            logger.error("Failed to insert user into DB: {}", e.getMessage());
            throw new RuntimeException("Database error during registration: " + e.getMessage());
        }

        User saved = userRepository.findById(UUID.fromString(id))
                .orElseThrow(() -> new RuntimeException("User was not saved correctly"));
>>>>>>> fe0bfdb83fba51afad75c13a67981f2abe261f05

        UserDetails userDetails = userDetailsService.loadUserByUsername(saved.getEmail());
        String token = jwtUtil.generateToken(userDetails, saved.getRole());

        return LoginResponse.builder()
                .token(token)
                .tokenType("Bearer")
                .userId(saved.getId())
                .name(saved.getName())
                .email(saved.getEmail())
                .role(saved.getRole())
                .build();
    }

    public LoginResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new BadCredentialsException("Invalid email or password"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new BadCredentialsException("Invalid email or password");
        }

        UserDetails userDetails = userDetailsService.loadUserByUsername(user.getEmail());
        String token = jwtUtil.generateToken(userDetails, user.getRole());

        return LoginResponse.builder()
                .token(token)
                .tokenType("Bearer")
                .userId(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole())
                .build();
    }

    public void changePassword(String email, String currentPassword, String newPassword) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BadCredentialsException("User not found"));

        if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
            throw new BadCredentialsException("Invalid current password");
        }

        final String encodedPassword = passwordEncoder.encode(newPassword);
        final String finalEmail = email;
<<<<<<< HEAD
        jdbcTemplate.execute((java.sql.Connection conn) -> {
            String sql = "UPDATE users SET password = ? WHERE email = ?";
=======
        String sql = "UPDATE users SET password = ? WHERE email = ?";
        jdbcTemplate.execute((java.sql.Connection conn) -> {
>>>>>>> fe0bfdb83fba51afad75c13a67981f2abe261f05
            try (java.sql.PreparedStatement ps = conn.prepareStatement(sql)) {
                ps.setString(1, encodedPassword);
                ps.setString(2, finalEmail);
                ps.execute();
            }
            return null;
        });
    }

    public java.util.List<User> getAllHRUsers() {
        // Use JPA for reading, it's safer and should work fine with Strings
        return userRepository.findAll().stream()
                .filter(u -> !"ADMIN".equalsIgnoreCase(u.getRole()))
                .toList();
    }

<<<<<<< HEAD
    public void deleteUser(String id) {
        jdbcTemplate.execute("DELETE FROM users WHERE id = '" + id + "'");
=======
    public void deleteUser(java.util.UUID id) {
        if (!userRepository.existsById(id)) {
            throw new java.util.NoSuchElementException("User not found with id: " + id);
        }
        final String finalId = id.toString();
        jdbcTemplate.execute("DELETE FROM users WHERE id = '" + finalId + "'");
>>>>>>> fe0bfdb83fba51afad75c13a67981f2abe261f05
    }
}
