package com.policypal.auth;

import java.time.Instant;
import java.util.Locale;
import java.util.UUID;
import com.policypal.document.DocumentService;

import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtEncoder jwtEncoder;
    private final JwtProperties jwtProperties;
    private final DocumentService documentService;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder,
            JwtEncoder jwtEncoder, JwtProperties jwtProperties, DocumentService documentService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtEncoder = jwtEncoder;
        this.jwtProperties = jwtProperties;
        this.documentService = documentService;
    }

    @Transactional
    public TokenResponse register(RegisterRequest request) {
        String email = normalise(request.email());

        if (userRepository.existsByEmail(email)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "An account with this email already exists");
        }

        UUID id = UUID.randomUUID();
        userRepository.save(id, email, passwordEncoder.encode(request.password()));
        return createToken(id, email);
    }

    public TokenResponse login(LoginRequest request) {
        String email = normalise(request.email());

        // Same message whether the email or the password is wrong
        UserRecord user = userRepository.findByEmail(email)
                .filter(found -> passwordEncoder.matches(request.password(), found.passwordHash()))
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED, "Email or password is incorrect"));

        return createToken(user.id(), user.email());
    }

    // A private, throwaway account with the sample handbook already loaded
    @Transactional
    public TokenResponse startDemo() {
        UUID id = UUID.randomUUID();
        String email = "demo-" + id.toString().substring(0, 8) + "@demo.policypal";

        // A random password nobody knows, so this account only works through its token
        userRepository.save(id, email, passwordEncoder.encode(UUID.randomUUID().toString()));
        documentService.addSample(id);

        return createToken(id, email);
    }

    private TokenResponse createToken(UUID userId, String email) {
        Instant now = Instant.now();
        Instant expiresAt = now.plus(jwtProperties.expiry());

        JwtClaimsSet claims = JwtClaimsSet.builder()
                .issuer("policypal")
                .subject(userId.toString())
                .claim("email", email)
                .issuedAt(now)
                .expiresAt(expiresAt)
                .build();

        JwsHeader header = JwsHeader.with(MacAlgorithm.HS256).build();
        String token = jwtEncoder.encode(JwtEncoderParameters.from(header, claims)).getTokenValue();

        return new TokenResponse(token, email, expiresAt);
    }

    private static String normalise(String email) {
        return email.strip().toLowerCase(Locale.ROOT);
    }
}