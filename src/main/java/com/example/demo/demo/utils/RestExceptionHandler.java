package com.example.demo.demo.utils;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.server.ServerWebExchange;

import java.io.IOException;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Global exception handler for REST controllers.
 * This class provides centralized exception handling for various types of exceptions
 * that may occur during request processing, returning appropriate HTTP responses.
 */
@ControllerAdvice
public class RestExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(RestExceptionHandler.class);

    /**
     * Handles {@link IOException} specifically, typically occurring during file read operations.
     * Returns a BAD_REQUEST status with a descriptive error message.
     *
     * @param ex The {@link IOException} that was thrown.
     * @param exchange The current server web exchange.
     * @return A {@link ResponseEntity} containing the error details and HTTP status.
     */
    @ExceptionHandler(IOException.class)
    public ResponseEntity<Object> handleIOException(IOException ex, ServerWebExchange exchange) {
        log.error("Error reading uploaded file for request: {}", exchange.getRequest().getURI(), ex);
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("status", HttpStatus.BAD_REQUEST.value());
        body.put("error", "File Read Error");
        body.put("message", "Could not read the uploaded file. It may be corrupt or unreadable.");
        return new ResponseEntity<>(body, HttpStatus.BAD_REQUEST);
    }

    /**
     * A general exception handler for any other unhandled exceptions.
     * Returns an INTERNAL_SERVER_ERROR status with a generic error message.
     *
     * @param ex The {@link Exception} that was thrown.
     * @param exchange The current server web exchange.
     * @return A {@link ResponseEntity} containing the error details and HTTP status.
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Object> handleGenericException(Exception ex, ServerWebExchange exchange) {
        log.error("An unexpected error occurred during transformation for request: {}", exchange.getRequest().getURI(), ex);
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("status", HttpStatus.INTERNAL_SERVER_ERROR.value());
        body.put("error", "Transformation Error");
        body.put("message", "An internal error occurred: " + ex.getMessage());
        return new ResponseEntity<>(body, HttpStatus.INTERNAL_SERVER_ERROR);
    }
}
