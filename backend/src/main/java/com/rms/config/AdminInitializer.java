// package com.rms.config;

// import com.rms.model.User;
// import com.rms.repository.UserRepository;
// import org.slf4j.Logger;
// import org.slf4j.LoggerFactory;
// import org.springframework.beans.factory.annotation.Autowired;
// import org.springframework.boot.ApplicationArguments;
// import org.springframework.boot.ApplicationRunner;
// import org.springframework.security.crypto.password.PasswordEncoder;
// import org.springframework.stereotype.Component;

// /**
//  * AdminInitializer — runs on every startup.
//  * Inserts the default ADMIN account if it does not already exist.
//  * Password is BCrypt-encoded automatically.
//  */
// @Component
// public class AdminInitializer implements ApplicationRunner {

//     private static final Logger log = LoggerFactory.getLogger(AdminInitializer.class);

//     private static final String ADMIN_NAME     = "CADDAM Admin";
//     private static final String ADMIN_EMAIL    = "caddamtechnologies@gmail.com";
//     private static final String ADMIN_PASSWORD = "Caddamtech7010@";
//     private static final String ADMIN_ROLE     = "ADMIN";

//     @Autowired
//     private UserRepository userRepository;

//     @Autowired
//     private PasswordEncoder passwordEncoder;

//     @Override
//     public void run(ApplicationArguments args) {
//         System.out.println("=================================================");
//         System.out.println("UPDATING DEFAULT ADMIN ACCOUNT...");

//         if (!userRepository.existsByEmail(ADMIN_EMAIL)) {
//             User admin = User.builder()
//                     .name(ADMIN_NAME)
//                     .email(ADMIN_EMAIL)
//                     .password(passwordEncoder.encode(ADMIN_PASSWORD))
//                     .role(ADMIN_ROLE)
//                     .build();
//             userRepository.save(admin);
//             log.info("Admin account CREATED: {}", ADMIN_EMAIL);
//         } else {
//             // Always sync password in case it changed
//             User admin = userRepository.findByEmail(ADMIN_EMAIL).get();
//             admin.setPassword(passwordEncoder.encode(ADMIN_PASSWORD));
//             admin.setRole(ADMIN_ROLE);
//             admin.setName(ADMIN_NAME);
//             userRepository.save(admin);
//             log.info("Admin account UPDATED: {}", ADMIN_EMAIL);
//         }

//         System.out.println("=================================================");
//         System.out.println("ADMIN ACCOUNT CONFIGURED");
//         System.out.println("Email: " + ADMIN_EMAIL);
//         System.out.println("Password: " + ADMIN_PASSWORD);
//         System.out.println("=================================================");
//     }
// }
