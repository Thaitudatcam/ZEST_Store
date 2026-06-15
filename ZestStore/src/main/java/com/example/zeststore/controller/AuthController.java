package com.example.zeststore.controller;

import com.example.zeststore.dto.request.LoginRequest;
import com.example.zeststore.dto.request.RegisterRequest;
import com.example.zeststore.dto.response.AuthResponse;
import com.example.zeststore.entity.GioHang;
import com.example.zeststore.entity.DanhSachYeuThich;
import com.example.zeststore.entity.NguoiDung;
import com.example.zeststore.entity.VaiTro;
import com.example.zeststore.repository.NguoiDungRepository;
import com.example.zeststore.repository.GioHangRepository;
import com.example.zeststore.repository.DanhSachYeuThichRepository;
import com.example.zeststore.repository.VaiTroRepository;
import com.example.zeststore.security.JwtTokenProvider;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider jwtTokenProvider;
    private final NguoiDungRepository nguoiDungRepository;
    private final VaiTroRepository vaiTroRepository;
    private final GioHangRepository gioHangRepository;
    private final DanhSachYeuThichRepository danhSachYeuThichRepository;
    private final PasswordEncoder passwordEncoder;

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getMatKhau()));

        NguoiDung nguoiDung = nguoiDungRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));

        String token = jwtTokenProvider.generateToken(
                nguoiDung.getEmail(), nguoiDung.getVaiTro().getTenVaiTro());

        return ResponseEntity.ok(AuthResponse.builder()
                .token(token)
                .tokenType("Bearer")
                .maNguoiDung(nguoiDung.getMaNguoiDung())
                .email(nguoiDung.getEmail())
                .hoTen(nguoiDung.getHoTen())
                .vaiTro(nguoiDung.getVaiTro().getTenVaiTro())
                .build());
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest request) {
        if (nguoiDungRepository.existsByEmail(request.getEmail())) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("message", "Email already exists"));
        }

        if (request.getSoDienThoai() != null
                && nguoiDungRepository.existsBySoDienThoai(request.getSoDienThoai())) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("message", "Phone number already exists"));
        }

        VaiTro customerRole = vaiTroRepository.findByTenVaiTro("CUSTOMER")
                .orElseThrow(() -> new RuntimeException("Default role not found"));

        NguoiDung nguoiDung = NguoiDung.builder()
                .vaiTro(customerRole)
                .hoTen(request.getHoTen())
                .email(request.getEmail())
                .matKhauMaHoa(passwordEncoder.encode(request.getMatKhau()))
                .soDienThoai(request.getSoDienThoai())
                .trangThai(1)
                .build();
        nguoiDung = nguoiDungRepository.save(nguoiDung);

        gioHangRepository.save(GioHang.builder().nguoiDung(nguoiDung).build());
        danhSachYeuThichRepository.save(DanhSachYeuThich.builder().nguoiDung(nguoiDung).build());

        String token = jwtTokenProvider.generateToken(
                nguoiDung.getEmail(), nguoiDung.getVaiTro().getTenVaiTro());

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(AuthResponse.builder()
                        .token(token)
                        .tokenType("Bearer")
                        .maNguoiDung(nguoiDung.getMaNguoiDung())
                        .email(nguoiDung.getEmail())
                        .hoTen(nguoiDung.getHoTen())
                        .vaiTro(nguoiDung.getVaiTro().getTenVaiTro())
                        .build());
    }

    @PostMapping("/refresh")
    public ResponseEntity<?> refresh(@RequestBody Map<String, String> request) {
        String oldToken = request.get("token");
        if (oldToken == null || !jwtTokenProvider.validateToken(oldToken)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Invalid or expired token"));
        }

        String email = jwtTokenProvider.getEmailFromToken(oldToken);
        NguoiDung nguoiDung = nguoiDungRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        String newToken = jwtTokenProvider.generateToken(
                nguoiDung.getEmail(), nguoiDung.getVaiTro().getTenVaiTro());

        return ResponseEntity.ok(AuthResponse.builder()
                .token(newToken)
                .tokenType("Bearer")
                .maNguoiDung(nguoiDung.getMaNguoiDung())
                .email(nguoiDung.getEmail())
                .hoTen(nguoiDung.getHoTen())
                .vaiTro(nguoiDung.getVaiTro().getTenVaiTro())
                .build());
    }
}