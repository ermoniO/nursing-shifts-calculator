package com.nursingshifts.auth;

import com.nursingshifts.web.dto.Dtos.LoginRequest;
import com.nursingshifts.web.dto.Dtos.MessageResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import com.nursingshifts.web.dto.Dtos.TokenResponse;

@RestController
public class AuthController {

    private final PasswordAuth auth;

    public AuthController(PasswordAuth auth) {
        this.auth = auth;
    }

    @PostMapping("/api/auth/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request) throws InterruptedException {
        if (auth.passwordMatches(request.password())) {
            return ResponseEntity.ok(new TokenResponse(auth.token()));
        }
        Thread.sleep(600); // slows down password guessing
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(new MessageResponse("Wrong password"));
    }
}
