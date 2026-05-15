package com.rms.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
public class DataInitializer implements CommandLineRunner {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Value("${app.init-db:false}")
    private String initDb;

    @Override
    public void run(String... args) throws Exception {
        if (!"true".equalsIgnoreCase(initDb)) {
            System.out.println("[INIT-DATA] Skipping data initialization (app.init-db is not set to true).");
            return;
        }

        System.out.println("[INIT-DATA] Starting data initialization check...");
        try {
            // Check if table exists
            try {
                jdbcTemplate.execute("SELECT 1 FROM users LIMIT 1");
                System.out.println("[INIT-DATA] 'users' table exists.");
            } catch (Exception e) {
                System.out.println("[INIT-DATA] 'users' table might not exist yet: " + e.getMessage());
                return;
            }

            Integer count = jdbcTemplate.queryForObject("SELECT count(*) FROM users", Integer.class);
            System.out.println("[INIT-DATA] Current user count: " + count);
            
            if (count != null && count == 0) {
                System.out.println("[INIT-DATA] No users found. Creating default admin user...");
                
                String id = UUID.randomUUID().toString();
                String name = "System Admin";
                String email = "caddamtechnologies@gmail.com";
                String password = passwordEncoder.encode("Caddamtech70@");
                String role = "ADMIN";
                
                // Using PreparedStatement.execute() which is often better supported
                jdbcTemplate.execute((java.sql.Connection conn) -> {
                    String sql = "INSERT INTO users (id, name, email, password, role) VALUES (?, ?, ?, ?, ?)";
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
                
                System.out.println("[INIT-DATA] Default admin user created successfully.");
                System.out.println("[INIT-DATA] Login Email: " + email);
            } else {
                System.out.println("[INIT-DATA] Skipping creation as users already exist.");
            }
        } catch (Exception e) {
            System.err.println("[INIT-DATA] ERROR during initialization:");
            e.printStackTrace();
        }
    }
}
