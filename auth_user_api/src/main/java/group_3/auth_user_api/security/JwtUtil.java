package group_3.auth_user_api.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.MalformedJwtException;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.SignatureException;
import io.jsonwebtoken.UnsupportedJwtException;
import io.jsonwebtoken.security.Keys;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.security.Key;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

@Component
public class JwtUtil {
    private static final Logger logger = LoggerFactory.getLogger(JwtUtil.class);

    @Value("${jwt.secret:your-very-long-secret-key-should-be-kept-safe}")
    private String secret;

    @Value("${jwt.expiration:86400000}")
    private Long expiration; // Default: 24 hours in milliseconds

    private Key getSigningKey() {
        // Use at least 32 bytes (256 bits) for HMAC-SHA256
        byte[] keyBytes = secret.getBytes();
        logger.debug("JWT signing key length: {} bytes", keyBytes.length);
        return Keys.hmacShaKeyFor(keyBytes);
    }

    public String generateToken(String email) {
        Map<String, Object> claims = new HashMap<>();
        logger.debug("Generating JWT token for email: {}", email);
        return createToken(claims, email);
    }

    private String createToken(Map<String, Object> claims, String subject) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + expiration);
        logger.debug("Creating token with expiry: {}", expiryDate);

        return Jwts.builder()
                .setClaims(claims)
                .setSubject(subject)
                .setIssuedAt(now)
                .setExpiration(expiryDate)
                .signWith(getSigningKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    public String extractEmail(String token) {
        try {
            String email = extractClaim(token, Claims::getSubject);
            logger.debug("Extracted email from token: {}", email);
            return email;
        } catch (Exception e) {
            logger.error("Error extracting email from token: {}", e.getMessage());
            throw e;
        }
    }

    public Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }

    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    private Claims extractAllClaims(String token) {
        try {
            return Jwts.parserBuilder()
                    .setSigningKey(getSigningKey())
                    .build()
                    .parseClaimsJws(token)
                    .getBody();
        } catch (ExpiredJwtException e) {
            logger.error("JWT token expired: {}", e.getMessage());
            throw e;
        } catch (UnsupportedJwtException e) {
            logger.error("Unsupported JWT token: {}", e.getMessage());
            throw e;
        } catch (MalformedJwtException e) {
            logger.error("Malformed JWT token: {}", e.getMessage());
            throw e;
        } catch (SignatureException e) {
            logger.error(
                    "Invalid JWT signature: {}. This is usually caused by a mismatch between the signing key used to create the token and the one used to verify it.",
                    e.getMessage());
            throw e;
        } catch (Exception e) {
            logger.error("JWT token validation error: {}", e.getMessage());
            throw e;
        }
    }

    public Boolean validateToken(String token, String email) {
        try {
            final String extractedEmail = extractEmail(token);
            boolean notExpired = !isTokenExpired(token);
            boolean emailsMatch = extractedEmail.equals(email);

            logger.debug("Token validation: extracted email={}, provided email={}, expired={}, valid={}",
                    extractedEmail, email, !notExpired, (emailsMatch && notExpired));

            return (emailsMatch && notExpired);
        } catch (Exception e) {
            logger.error("Token validation failed: {}", e.getMessage());
            return false;
        }
    }

    public Boolean isTokenExpired(String token) {
        try {
            Date expiration = extractExpiration(token);
            boolean isExpired = expiration.before(new Date());
            logger.debug("Token expiration check: expires at {}, expired={}", expiration, isExpired);
            return isExpired;
        } catch (Exception e) {
            logger.error("Error checking token expiration: {}", e.getMessage());
            return true; // Consider expired if we can't check
        }
    }
}
