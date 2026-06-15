package com.example.zeststore.controller;

import com.example.zeststore.service.FileUploadService;
import com.example.zeststore.service.SanPhamService;
import com.example.zeststore.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequiredArgsConstructor
public class FileController {

    private final FileUploadService fileUploadService;
    private final SanPhamService sanPhamService;
    private final UserService userService;

    @PostMapping("/api/upload/variant/{variantId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> uploadProductImage(@PathVariable Integer variantId,
                                                 @RequestParam("file") MultipartFile file) {
        String fileName = fileUploadService.storeFile(file);
        String url = "/api/files/" + fileName;
        return ResponseEntity.ok(sanPhamService.addImage(variantId, url));
    }

    @PostMapping("/api/upload/avatar")
    public ResponseEntity<?> uploadAvatar(Authentication auth,
                                           @RequestParam("file") MultipartFile file) {
        String fileName = fileUploadService.storeFile(file);
        String url = "/api/files/" + fileName;
        Integer userId = userService.getUserByEmail(auth.getName()).getMaNguoiDung();
        userService.updateAvatar(userId, url);
        return ResponseEntity.ok(Map.of("url", url));
    }

    @GetMapping("/api/files/{fileName}")
    public ResponseEntity<?> serveFile(@PathVariable String fileName) {
        try {
            Resource resource = fileUploadService.loadFile(fileName);
            String contentType = determineContentType(fileName);
            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType))
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + resource.getFilename() + "\"")
                    .body(resource);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    private String determineContentType(String fileName) {
        String ext = fileName.substring(fileName.lastIndexOf(".") + 1).toLowerCase();
        return switch (ext) {
            case "png" -> "image/png";
            case "gif" -> "image/gif";
            case "webp" -> "image/webp";
            default -> "image/jpeg";
        };
    }
}
