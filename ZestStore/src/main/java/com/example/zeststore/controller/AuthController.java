package com.example.zeststore.controller;

import com.example.zeststore.dto.request.LoginRequest;
import com.example.zeststore.dto.request.RefreshTokenRequest;
import com.example.zeststore.dto.request.RegisterRequest;
import com.example.zeststore.dto.request.QuenMatKhauRequest;
import com.example.zeststore.dto.request.DatLaiMatKhauRequest;
import com.example.zeststore.dto.request.XacThucEmailRequest;
import com.example.zeststore.dto.request.XacThucQuenMatKhauRequest;
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
import com.example.zeststore.service.AutoGrantService;
import com.example.zeststore.service.AuthService;
import jakarta.validation.Valid;
import jakarta.servlet.http.Cookie;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
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
    private final AutoGrantService autoGrantService;
    private final AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getMatKhau()));

        String userEmail = authentication.getName();
        NguoiDung nguoiDung = nguoiDungRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found with email: " + userEmail));

        LocalDateTime lastLogin = nguoiDung.getNgayDangNhapCuoi();
        nguoiDung.setNgayDangNhapCuoi(LocalDateTime.now());
        nguoiDungRepository.save(nguoiDung);

        if (lastLogin != null) {
            long diffDays = ChronoUnit.DAYS.between(lastLogin, LocalDateTime.now());
            autoGrantService.handleQuayLai(nguoiDung, diffDays);
        }

        String token = jwtTokenProvider.generateToken(
                nguoiDung.getEmail(), nguoiDung.getVaiTro().getTenVaiTro(), nguoiDung.getChoPhepBanHang());

        Cookie jwtCookie = new Cookie("jwtToken", token);
        jwtCookie.setHttpOnly(true);
        jwtCookie.setSecure(false);
        jwtCookie.setPath("/");
        jwtCookie.setMaxAge(7 * 24 * 60 * 60);
        jwtCookie.setAttribute("SameSite", "Lax");

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, jwtCookie.getName() + "=" + jwtCookie.getValue()
                        + "; HttpOnly; Path=/; Max-Age=" + jwtCookie.getMaxAge() + "; SameSite=Lax")
                .body(AuthResponse.builder()
                        .token(token)
                        .tokenType("Bearer")
                        .maNguoiDung(nguoiDung.getMaNguoiDung())
                        .email(nguoiDung.getEmail())
                        .hoTen(nguoiDung.getHoTen())
                        .vaiTro(nguoiDung.getVaiTro().getTenVaiTro())
                        .choPhepBanHang(nguoiDung.getChoPhepBanHang())
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

        autoGrantService.handleDangKyMoi(nguoiDung);

        String token = jwtTokenProvider.generateToken(
                nguoiDung.getEmail(), nguoiDung.getVaiTro().getTenVaiTro(), nguoiDung.getChoPhepBanHang());

        Cookie jwtCookie = new Cookie("jwtToken", token);
        jwtCookie.setHttpOnly(true);
        jwtCookie.setSecure(false);
        jwtCookie.setPath("/");
        jwtCookie.setMaxAge(7 * 24 * 60 * 60);
        jwtCookie.setAttribute("SameSite", "Lax");

        return ResponseEntity.status(HttpStatus.CREATED)
                .header(HttpHeaders.SET_COOKIE, jwtCookie.getName() + "=" + jwtCookie.getValue()
                        + "; HttpOnly; Path=/; Max-Age=" + jwtCookie.getMaxAge() + "; SameSite=Lax")
                .body(AuthResponse.builder()
                        .token(token)
                        .tokenType("Bearer")
                        .maNguoiDung(nguoiDung.getMaNguoiDung())
                        .email(nguoiDung.getEmail())
                        .hoTen(nguoiDung.getHoTen())
                        .vaiTro(nguoiDung.getVaiTro().getTenVaiTro())
                        .choPhepBanHang(nguoiDung.getChoPhepBanHang())
                        .build());
    }

    @PostMapping("/gui-ma-xac-thuc")
    public ResponseEntity<?> guiMaXacThuc(Authentication auth) {
        String email = auth.getName();
        return ResponseEntity.ok(authService.guiOtp(email));
    }

    @PostMapping("/xac-thuc-email")
    public ResponseEntity<?> xacThucEmail(Authentication auth,
                                           @Valid @RequestBody XacThucEmailRequest request) {
        String email = auth.getName();
        return ResponseEntity.ok(authService.xacThucOtp(email, request.getMaXacThuc()));
    }

    @PostMapping("/quen-mat-khau")
    public ResponseEntity<?> quenMatKhau(@Valid @RequestBody QuenMatKhauRequest request) {
        return ResponseEntity.ok(authService.guiOtpQuenMatKhau(request.getEmail()));
    }

    @PostMapping("/dat-lai-mat-khau")
    public ResponseEntity<?> datLaiMatKhau(@Valid @RequestBody DatLaiMatKhauRequest request) {
        return ResponseEntity.ok(authService.datLaiMatKhau(request.getEmail(), request.getMaXacThuc(), request.getMatKhauMoi()));
    }

    @PostMapping("/xac-thuc-quen-mat-khau")
    public ResponseEntity<?> xacThucQuenMatKhau(@Valid @RequestBody XacThucQuenMatKhauRequest request) {
        return ResponseEntity.ok(authService.xacThucQuenMatKhau(request.getEmail(), request.getMaXacThuc()));
    }

    @PostMapping("/refresh")
    public ResponseEntity<?> refresh(@Valid @RequestBody RefreshTokenRequest request) {
        String oldToken = request.getToken();
        if (!jwtTokenProvider.validateToken(oldToken)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Invalid or expired token"));
        }

        String email = jwtTokenProvider.getEmailFromToken(oldToken);
        NguoiDung nguoiDung = nguoiDungRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        String newToken = jwtTokenProvider.generateToken(
                nguoiDung.getEmail(), nguoiDung.getVaiTro().getTenVaiTro(), nguoiDung.getChoPhepBanHang());

        return ResponseEntity.ok(AuthResponse.builder()
                .token(newToken)
                .tokenType("Bearer")
                .maNguoiDung(nguoiDung.getMaNguoiDung())
                .email(nguoiDung.getEmail())
                .hoTen(nguoiDung.getHoTen())
                .vaiTro(nguoiDung.getVaiTro().getTenVaiTro())
                .choPhepBanHang(nguoiDung.getChoPhepBanHang())
                .build());
    }
}