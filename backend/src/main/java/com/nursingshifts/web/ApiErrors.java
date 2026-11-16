package com.nursingshifts.web;

import com.nursingshifts.web.dto.Dtos.MessageResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.format.DateTimeParseException;

/** Turns errors into { "message": "..." } JSON with the right status code. */
@RestControllerAdvice
public class ApiErrors {

    public static class NotFoundException extends RuntimeException {
        public NotFoundException(String message) {
            super(message);
        }
    }

    public static class ConflictException extends RuntimeException {
        public ConflictException(String message) {
            super(message);
        }
    }

    @ExceptionHandler(NotFoundException.class)
    public ResponseEntity<MessageResponse> notFound(NotFoundException e) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new MessageResponse(e.getMessage()));
    }

    @ExceptionHandler(ConflictException.class)
    public ResponseEntity<MessageResponse> conflict(ConflictException e) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(new MessageResponse(e.getMessage()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<MessageResponse> invalid(MethodArgumentNotValidException e) {
        String message = e.getBindingResult().getFieldErrors().stream()
                .findFirst()
                .map(err -> err.getDefaultMessage())
                .orElse("Some fields are invalid");
        return ResponseEntity.badRequest().body(new MessageResponse(message));
    }

    @ExceptionHandler({DateTimeParseException.class, IllegalArgumentException.class})
    public ResponseEntity<MessageResponse> badInput(RuntimeException e) {
        return ResponseEntity.badRequest().body(new MessageResponse("Invalid value: " + e.getMessage()));
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<MessageResponse> unreadable(HttpMessageNotReadableException e) {
        return ResponseEntity.badRequest().body(new MessageResponse("The request couldn't be read. Check the dates, times and numbers."));
    }
}
