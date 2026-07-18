package com.example.zeststore.service;

import com.example.zeststore.entity.ThanhToan;
import com.example.zeststore.exception.BadRequestException;
import com.example.zeststore.repository.ThanhToanRepository;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class NapTienService {

    private final ThanhToanRepository thanhToanRepository;
    private final VnPayService vnPayService;
    private final MomoService momoService;
    private final ZaloPayService zaloPayService;

    @Transactional
    public Map<String, Object> createNapTien(BigDecimal soTien, Integer phuongThuc, Integer maNguoiDung, String ipAddress) {
        if (soTien.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BadRequestException("Số tiền phải lớn hơn 0");
        }
        if (soTien.compareTo(new BigDecimal("100000000")) > 0) {
            throw new BadRequestException("Số tiền nạp tối đa là 100,000,000đ");
        }

        String nhaCungCap;
        if (phuongThuc == 4) nhaCungCap = "VNPay";
        else if (phuongThuc == 5) nhaCungCap = "MoMo";
        else if (phuongThuc == 6) nhaCungCap = "ZaloPay";
        else throw new BadRequestException("Phương thức thanh toán không hợp lệ");

        ThanhToan payment = new ThanhToan();
        payment.setDonHang(null);
        payment.setMaNguoiDung(maNguoiDung);
        payment.setSoTien(soTien);
        payment.setPhuongThuc(phuongThuc);
        payment.setNhaCungCap(nhaCungCap);
        payment.setTrangThaiThanhToan(1);
        payment.setThoiGianTao(LocalDateTime.now());
        payment.setMaGiaoDich("NAPVI-0-" + System.currentTimeMillis());

        payment = thanhToanRepository.save(payment);

        payment.setMaGiaoDich("NAPVI-" + payment.getMaThanhToan() + "-" + System.currentTimeMillis());
        payment = thanhToanRepository.save(payment);

        String paymentUrl;
        if (phuongThuc == 4) {
            paymentUrl = vnPayService.createPaymentUrl(payment.getMaGiaoDich(), ipAddress);
        } else if (phuongThuc == 5) {
            paymentUrl = momoService.createPaymentUrl(payment.getMaGiaoDich());
        } else {
            Map<String, String> zaloResult = zaloPayService.createOrderByMaGiaoDich(payment.getMaGiaoDich());
            paymentUrl = zaloResult.get("orderUrl");
        }

        return Map.of(
                "paymentUrl", paymentUrl,
                "maThanhToan", payment.getMaThanhToan()
        );
    }
}
