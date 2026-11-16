package com.nursingshifts.auth;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.MessageDigest;
import java.util.Base64;

/**
 * One password, no user accounts.
 *
 * Logging in with the right password returns a token derived from that password.
 * The browser sends the token with every request. Changing APP_PASSWORD on Render
 * changes the token, which signs out every device.
 */
@Component
public class PasswordAuth {

    private final String password;
    private final String token;

    public PasswordAuth(@Value("${app.password}") String password) {
        if (password == null || password.isBlank()) {
            throw new IllegalStateException(
                    "APP_PASSWORD is not set. Set it as an environment variable before starting the app.");
        }
        this.password = password;
        this.token = hmac(password, "nursing-shifts-calculator-session");
    }

    public boolean passwordMatches(String attempt) {
        return attempt != null && constantTimeEquals(attempt, password);
    }

    public boolean tokenMatches(String attempt) {
        return attempt != null && constantTimeEquals(attempt, token);
    }

    public String token() {
        return token;
    }

    private static boolean constantTimeEquals(String a, String b) {
        return MessageDigest.isEqual(a.getBytes(StandardCharsets.UTF_8), b.getBytes(StandardCharsets.UTF_8));
    }

    private static String hmac(String key, String message) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(key.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            byte[] raw = mac.doFinal(message.getBytes(StandardCharsets.UTF_8));
            return Base64.getUrlEncoder().withoutPadding().encodeToString(raw);
        } catch (GeneralSecurityException e) {
            throw new IllegalStateException("Could not create the session token", e);
        }
    }
}
