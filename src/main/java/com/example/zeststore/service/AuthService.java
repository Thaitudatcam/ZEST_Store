package com.example.zeststore.service;

import com.example.zeststore.entity.NguoiDung;
import com.example.zeststore.exception.BadRequestException;
import com.example.zeststore.exception.ResourceNotFoundException;
import com.example.zeststore.repository.NguoiDungRepository;
import jakarta.mail.MessagingException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final NguoiDungRepository nguoiDungRepository;
    private final EmailService emailService;
    private final PasswordEncoder passwordEncoder;

    private static final Duration RATE_LIMIT = Duration.ofSeconds(60);
    private static final Duration OTP_EXPIRY = Duration.ofMinutes(10);
    private static final int MAX_ATTEMPTS = 5;

    public String taoOtp() {
        SecureRandom random = new SecureRandom();
        int code = 100000 + random.nextInt(900000);
        return String.valueOf(code);
    }

    public String hashOtp(String otp) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(otp.getBytes(StandardCharsets.UTF_8));
            StringBuilder hex = new StringBuilder();
            for (byte b : hash) {
                hex.append(String.format("%02x", b));
            }
            return hex.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 not available", e);
        }
    }

    @Transactional
    public Map<String, Object> guiOtp(String email) {
        NguoiDung user = nguoiDungRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));
        return guiOtp(user, email);
    }

    @Transactional
    public Map<String, Object> guiOtp(NguoiDung user, String recipientEmail) {
        if (user.getLanGuiCuoi() != null) {
            long secondsSinceLast = Duration.between(user.getLanGuiCuoi(), LocalDateTime.now()).getSeconds();
            if (secondsSinceLast < RATE_LIMIT.getSeconds()) {
                long wait = RATE_LIMIT.getSeconds() - secondsSinceLast;
                throw new BadRequestException("Vui lòng đợi " + wait + " giây trước khi yêu cầu mã mới");
            }
        }

        if (user.getMaXacThucHetHan() != null && user.getMaXacThucHetHan().isAfter(LocalDateTime.now())) {
            throw new BadRequestException("Mã xác thực hiện tại vẫn còn hiệu lực, vui lòng đợi mã hết hạn rồi gửi lại");
        }

        String otp = taoOtp();
        String hash = hashOtp(otp);
        user.setMaXacThucHash(hash);
        user.setMaXacThucHetHan(LocalDateTime.now().plus(OTP_EXPIRY));
        user.setLanGuiCuoi(LocalDateTime.now());
        user.setSoLanThuSai(0);
        nguoiDungRepository.save(user);

        try {
            emailService.sendOtpEmail(recipientEmail, otp);
        } catch (MessagingException e) {
            throw new RuntimeException("Không thể gửi email xác thực", e);
        }

        return Map.of("message", "Mã xác thực đã được gửi đến email của bạn");
    }

    @Transactional
    public Map<String, Object> xacThucOtp(String email, String otp) {
        NguoiDung user = nguoiDungRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));
        return xacThucOtp(user, otp, true);
    }

    @Transactional
    public Map<String, Object> xacThucOtp(NguoiDung user, String otp) {
        return xacThucOtp(user, otp, true);
    }

    private Map<String, Object> xacThucOtp(NguoiDung user, String otp, boolean markEmailVerified) {
        verifyOtpInternal(user, otp);

        user.setMaXacThucHash(null);
        user.setMaXacThucHetHan(null);
        user.setLanGuiCuoi(null);
        user.setSoLanThuSai(0);
        if (markEmailVerified) {
            user.setEmailDaXacThuc(true);
        }
        nguoiDungRepository.save(user);

        return Map.of("message", "Xác thực thành công");
    }

    private void verifyOtpInternal(NguoiDung user, String otp) {
        if (user.getMaXacThucHash() == null) {
            throw new BadRequestException("Chưa có mã xác thực nào được gửi");
        }

        if (user.getMaXacThucHetHan() == null || user.getMaXacThucHetHan().isBefore(LocalDateTime.now())) {
            user.setMaXacThucHash(null);
            user.setMaXacThucHetHan(null);
            user.setSoLanThuSai(0);
            nguoiDungRepository.save(user);
            throw new BadRequestException("Mã xác thực đã hết hạn. Vui lòng yêu cầu mã mới");
        }

        if (user.getSoLanThuSai() >= MAX_ATTEMPTS) {
            user.setMaXacThucHash(null);
            user.setMaXacThucHetHan(null);
            user.setSoLanThuSai(0);
            nguoiDungRepository.save(user);
            throw new BadRequestException("Bạn đã nhập sai quá " + MAX_ATTEMPTS + " lần. Vui lòng yêu cầu mã mới");
        }

        String inputHash = hashOtp(otp);
        if (!inputHash.equals(user.getMaXacThucHash())) {
            user.setSoLanThuSai(user.getSoLanThuSai() + 1);
            nguoiDungRepository.save(user);
            int remaining = MAX_ATTEMPTS - user.getSoLanThuSai();
            throw new BadRequestException("Mã xác thực không đúng. Còn " + remaining + " lần thử");
        }
    }

    @Transactional
    public Map<String, Object> guiOtpQuenMatKhau(String email) {
        NguoiDung user = nguoiDungRepository.findByEmail(email).orElse(null);

        if (user == null) {
            // Email có thể đang là email mới chưa xác thực (emailMoiChoXacThuc)
            // đã lưu từ tài khoản -> báo chưa xác thực thay vì "không tìm thấy".
            boolean isPendingEmail = nguoiDungRepository.findByEmailMoiChoXacThuc(email).isPresent();
            if (isPendingEmail) {
                throw new BadRequestException("Email chưa được xác thực, không thể đặt lại mật khẩu");
            }
            throw new BadRequestException("Không tìm thấy tài khoản với email này");
        }

        if (!Boolean.TRUE.equals(user.getEmailDaXacThuc())) {
            throw new BadRequestException("Email chưa được xác thực, không thể đặt lại mật khẩu");
        }

        return guiOtp(email);
    }

    @Transactional
    public Map<String, Object> xacThucQuenMatKhau(String email, String otp) {
        NguoiDung user = nguoiDungRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));

        verifyOtpInternal(user, otp);

        // Không xóa maXacThucHash/maXacThucHetHan -> datLaiMatKhau sau đó vẫn xác thực được.
        return Map.of("message", "Mã xác thực hợp lệ");
    }

    @Transactional
    public Map<String, Object> datLaiMatKhau(String email, String otp, String matKhauMoi) {
        NguoiDung user = nguoiDungRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));

        verifyOtpInternal(user, otp);

        if (passwordEncoder.matches(matKhauMoi, user.getMatKhauMaHoa())) {
            throw new BadRequestException("Mật khẩu mới không được trùng với mật khẩu cũ");
        }

        user.setMatKhauMaHoa(passwordEncoder.encode(matKhauMoi));
        user.setMaXacThucHash(null);
        user.setMaXacThucHetHan(null);
        user.setLanGuiCuoi(null);
        user.setSoLanThuSai(0);
        nguoiDungRepository.save(user);

        return Map.of("message", "Mật khẩu đã được đặt lại thành công");
    }
}
