package com.moodfit.exception;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.HandlerMethodValidationException;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import com.moodfit.dto.response.ErrorResponse;

import jakarta.validation.ConstraintViolationException;
import tools.jackson.core.JacksonException;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleRequestValidation(MethodArgumentNotValidException exception) {
        Map<String, String> fieldErrors = new LinkedHashMap<>();
        for (FieldError error : exception.getBindingResult().getFieldErrors()) {
            fieldErrors.put(error.getField(), error.getDefaultMessage());
        }

        return validationError(fieldErrors);
    }

    @ExceptionHandler(HandlerMethodValidationException.class)
    public ResponseEntity<ErrorResponse> handleMethodValidation(HandlerMethodValidationException exception) {
        Map<String, String> fieldErrors = new LinkedHashMap<>();
        exception.getParameterValidationResults().forEach(result -> {
            String parameterName = result.getMethodParameter().getParameterName();
            String fieldName = parameterName == null ? "parameter" : parameterName;
            String message = result.getResolvableErrors().isEmpty()
                    ? "Validation failed."
                    : result.getResolvableErrors().getFirst().getDefaultMessage();
            fieldErrors.put(fieldName, message);
        });

        return validationError(fieldErrors);
    }

    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ErrorResponse> handleConstraintViolation(ConstraintViolationException exception) {
        Map<String, String> fieldErrors = new LinkedHashMap<>();
        exception.getConstraintViolations().forEach(violation -> {
            String path = violation.getPropertyPath().toString();
            String fieldName = path.contains(".") ? path.substring(path.lastIndexOf('.') + 1) : path;
            fieldErrors.put(fieldName, violation.getMessage());
        });

        return validationError(fieldErrors);
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ErrorResponse> handleUnreadableRequest(HttpMessageNotReadableException exception) {
        Map<String, String> fieldErrors = new LinkedHashMap<>();
        if (exception.getCause() instanceof JacksonException jacksonException) {
            String fieldName = jacksonException.getPath().stream()
                    .map(JacksonException.Reference::getPropertyName)
                    .filter(Objects::nonNull)
                    .collect(Collectors.joining("."));
            if (!fieldName.isEmpty()) {
                fieldErrors.put(fieldName, "Invalid value.");
            }
        }
        return validationError(fieldErrors);
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ErrorResponse> handleTypeMismatch(MethodArgumentTypeMismatchException exception) {
        Map<String, String> fieldErrors = new LinkedHashMap<>();
        fieldErrors.put(exception.getName(), "Invalid value.");
        return validationError(fieldErrors);
    }

    @ExceptionHandler(CheckinNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleCheckinNotFound(CheckinNotFoundException exception) {
        ErrorResponse response = new ErrorResponse("CHECKIN_NOT_FOUND", exception.getMessage(), Map.of());
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
    }

    @ExceptionHandler(PendingImplementationException.class)
    public ResponseEntity<ErrorResponse> handlePendingImplementation(PendingImplementationException exception) {
        ErrorResponse response = new ErrorResponse("NOT_IMPLEMENTED", exception.getMessage(), Map.of());
        return ResponseEntity.status(HttpStatus.NOT_IMPLEMENTED).body(response);
    }

    private ResponseEntity<ErrorResponse> validationError(Map<String, String> fieldErrors) {
        ErrorResponse response = new ErrorResponse("VALIDATION_ERROR", "Request validation failed.", fieldErrors);
        return ResponseEntity.badRequest().body(response);
    }
}
