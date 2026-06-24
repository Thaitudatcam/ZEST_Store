package com.example.zeststore.controller;

import com.example.zeststore.service.FileUploadService;
import com.example.zeststore.service.SanPhamService;
import com.example.zeststore.service.UserService;
import lombok.RequiredArgsConstructor;
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
        return ResponseEntity.ok(sanPhamService.addImage(variantId, fileUploadService.storeAndGetUrl(file)));
    }

    @PostMapping("/api/upload/avatar")
    public ResponseEntity<?> uploadAvatar(Authentication auth,
                                           @RequestParam("file") MultipartFile file) {
        String url = fileUploadService.storeAndGetUrl(file);
        userService.updateAvatar(userService.getUserIdFromAuth(auth), url);
        return ResponseEntity.ok(Map.of("url", url));
    }

    @GetMapping("/api/files/{fileName}")
    public ResponseEntity<?> serveFile(@PathVariable String fileName) {
        return fileUploadService.serveFile(fileName);
    }
}
