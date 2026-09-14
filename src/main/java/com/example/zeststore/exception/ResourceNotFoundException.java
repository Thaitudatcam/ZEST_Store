package com.example.zeststore.exception;

public class ResourceNotFoundException extends RuntimeException {
    public ResourceNotFoundException(String message) {
        super(message);
    }

    public ResourceNotFoundException(String resource, Integer id) {
        super(resource + " not found with id: " + id);
    }

    public ResourceNotFoundException(String resource, String code) {
        super(resource + " not found with code: " + code);
    }
}
