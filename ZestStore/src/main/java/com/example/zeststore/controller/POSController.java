package com.example.zeststore.controller;

import com.example.zeststore.config.PaymentConfig;
import com.example.zeststore.dto.request.PosCartRequest;
import com.example.zeststore.dto.request.PosOrderRequest;
import com.example.zeststore.dto.response.PaymentResponse;
import com.example.zeststore.entity.BienTheSanPham;
import com.example.zeststore.entity.ThanhToan;
import com.example.zeststore.exception.BadRequestException;
import com.example.zeststore.repository.BienTheSanPhamRepository;
import com.example.zeststore.repository.ThanhToanRepository;
import com.example.zeststore.service.ThanhToanService;
import com.example.zeststore.service.POSService;
import com.example.zeststore.service.PaymentService;
import com.example.zeststore.service.PosCartService;
import com.example.zeststore.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/pos")
@RequiredArgsConstructor
public class POSController {

    private final POSService posService;
    private final PosCartService posCartService;
    private final UserService userService;
    private final BienTheSanPhamRepository bienTheRepository;
    private final ThanhToanRepository thanhToanRepository;
    private final ThanhToanService thanhToanService;
    private final PaymentService paymentService;
    private final PaymentConfig paymentConfig;

    @PostMapping("/orders")
    public ResponseEntity<?> createOrder(Authentication auth, @Valid @RequestBody PosOrderRequest request) {
        return ResponseEntity.ok(posService.createPosOrder(request, userService.getUserIdFromAuth(auth)));
    }

    @GetMapping("/cart")
    public ResponseEntity<?> getCart(Authentication auth) {
        return ResponseEntity.ok(posCartService.getCart(userService.getUserIdFromAuth(auth)));
    }

    @PostMapping("/cart/add")
    public ResponseEntity<?> addToCart(Authentication auth, @Valid @RequestBody PosCartRequest request) {
        return ResponseEntity.ok(posCartService.addItem(userService.getUserIdFromAuth(auth), request));
    }

    @PostMapping("/cart/release")
    public ResponseEntity<?> releaseFromCart(Authentication auth, @Valid @RequestBody PosCartRequest request) {
        posCartService.releaseItem(userService.getUserIdFromAuth(auth), request);
        return ResponseEntity.ok(Map.of("message", "Released"));
    }

    @DeleteMapping("/cart")
    public ResponseEntity<?> clearCart(Authentication auth) {
        posCartService.clearCart(userService.getUserIdFromAuth(auth));
        return ResponseEntity.ok(Map.of("message", "Cart cleared"));
    }

    @GetMapping("/scan")
    public ResponseEntity<?> scanSku(@RequestParam String sku) {
        BienTheSanPham v = bienTheRepository.findBySkuIgnoreCase(sku.trim())
            .orElseThrow(() -> new BadRequestException("Không tìm thấy sản phẩm với mã: " + sku));
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("maBienThe", v.getMaBienThe());
        result.put("tenSanPham", v.getSanPham().getTenSanPham());
        result.put("kichCo", v.getKichCo() != null ? v.getKichCo().getKichCo() : "");
        result.put("mauSac", v.getMauSac() != null ? v.getMauSac().getMauSac() : "");
        result.put("gia", v.getGia());
        result.put("tonKho", v.getTonKho());
        result.put("sku", v.getSku());
        result.put("urlAnh", v.getUrlAnh());
        return ResponseEntity.ok(result);
    }

    @PostMapping("/vietqr/preview")
    public ResponseEntity<?> previewVietQr(@RequestBody Map<String, Object> body) {
        BigDecimal amount = BigDecimal.valueOf(((Number) body.get("amount")).doubleValue());
        PaymentConfig.VietQrConfig config = paymentConfig.getVietqr();
        String addInfo = "Thanh+toan+tai+quay+ZestStore";
        String qrUrl = String.format(
                "https://img.vietqr.io/image/%s-%s-%s.jpg?amount=%s&addInfo=%s&accountName=%s",
                config.getBankBin(),
                config.getBankNumber(),
                config.getTemplate(),
                amount.longValue(),
                addInfo,
                URLEncoder.encode(config.getBankName(), StandardCharsets.UTF_8));
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("qrUrl", qrUrl);
        result.put("bankName", "MB Bank");
        result.put("accountNumber", config.getBankNumber());
        result.put("accountName", config.getBankName());
        result.put("amount", amount);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/payment-status/{orderId}")
    public ResponseEntity<?> getPaymentStatus(@PathVariable Integer orderId) {
        ThanhToan payment = thanhToanRepository.findByDonHang_MaDonHang(orderId)
                .stream().findFirst().orElse(null);
        if (payment == null) {
            return ResponseEntity.ok(Map.of("trangThaiThanhToan", 0));
        }
        return ResponseEntity.ok(Map.of(
                "trangThaiThanhToan", payment.getTrangThaiThanhToan(),
                "phuongThuc", payment.getPhuongThuc()
        ));
    }

    @PostMapping("/confirm-payment/{orderId}")
    public ResponseEntity<?> confirmPayment(@PathVariable Integer orderId) {
        ThanhToan payment = thanhToanRepository.findByDonHang_MaDonHang(orderId)
                .stream().findFirst()
                .orElseThrow(() -> new BadRequestException("Không tìm thấy thanh toán cho đơn hàng " + orderId));
        if (Integer.valueOf(2).equals(payment.getTrangThaiThanhToan())) {
            return ResponseEntity.ok(Map.of("message", "Đã thanh toán trước đó"));
        }
        thanhToanService.completePayment(payment.getMaThanhToan(), "POS-" + System.currentTimeMillis());
        return ResponseEntity.ok(Map.of("message", "Xác nhận thanh toán thành công"));
    }
}
