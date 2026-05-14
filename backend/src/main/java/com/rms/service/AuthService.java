package com.rms.service;

import com.rms.dto.LoginRequest;
import com.rms.dto.LoginResponse;
import com.rms.dto.RegisterRequest;
import com.rms.model.User;
import com.rms.repository.UserRepository;
import com.rms.security.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
public class AuthService {

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
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email already registered: " + request.getEmail());
        }

        String id = UUID.randomUUID().toString();
        String name = request.getName();
        String email = request.getEmail();
        String password = passwordEncoder.encode(request.getPassword());
        String role = request.getRole() != null ? request.getRole() : "RECRUITER";

        String sql = "INSERT INTO users (id, name, email, password, role, created_at) VALUES (?, ?, ?, ?, ?, datetime('now'))";
        jdbcTemplate.execute((java.sql.Connection conn) -> {
            try (java.sql.PreparedStatement ps = conn.prepareStatement(sql)) {
                ps.setString(1, id);
                ps.setString(2, name);
                ps.setString(3, email);
                ps.setString(4, password);
                ps.setString(5, role);
                ps.execute();
            }
            return null;
        });

        User saved = userRepository.findById(UUID.fromString(id)).orElseThrow();

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

        String encodedPassword = passwordEncoder.encode(newPassword);
        String sql = "UPDATE users SET password = ? WHERE email = ?";
        jdbcTemplate.execute((java.sql.Connection conn) -> {
            try (java.sql.PreparedStatement ps = conn.prepareStatement(sql)) {
                ps.setString(1, encodedPassword);
                ps.setString(2, email);
                ps.execute();
            }
            return null;
        });
    }

    public java.util.List<User> getAllHRUsers() {
        return userRepository.findByRoleNot("ADMIN");
    }

    public void deleteUser(java.util.UUID id) {
        if (!userRepository.existsById(id)) {
            throw new java.util.NoSuchElementException("User not found with id: " + id);
        }
        jdbcTemplate.execute("DELETE FROM users WHERE id = '" + id + "'");
    }
}
