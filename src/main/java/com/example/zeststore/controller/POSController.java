package com.example.zeststore.controller;

import com.example.zeststore.config.PaymentConfig;
import com.example.zeststore.dto.request.PosDraftRequest;
import com.example.zeststore.dto.request.PosOrderRequest;
import com.example.zeststore.entity.BienTheSanPham;
import com.example.zeststore.entity.ThanhToan;
import com.example.zeststore.exception.BadRequestException;
import com.example.zeststore.repository.BienTheSanPhamRepository;
import com.example.zeststore.repository.ThanhToanRepository;
import com.example.zeststore.service.CampaignDiscountService;
import com.example.zeststore.service.ThanhToanService;
import com.example.zeststore.service.POSService;
import com.example.zeststore.service.PaymentService;
import com.example.zeststore.service.PosCartService;
import com.example.zeststore.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
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
@PreAuthorize("hasAnyRole('ADMIN','STAFF')")
public class POSController {

    private final POSService posService;
    private final PosCartService posCartService;
    private final UserService userService;
    private final BienTheSanPhamRepository bienTheRepository;
    private final ThanhToanRepository thanhToanRepository;
    private final ThanhToanService thanhToanService;
    private final PaymentService paymentService;
    private final PaymentConfig paymentConfig;
    private final CampaignDiscountService campaignDiscountService;

    @PostMapping("/validate-coupon")
    public ResponseEntity<?> validateCoupon(@RequestBody Map<String, Object> body) {
        String maCode = (String) body.get("maCode");
        BigDecimal tongTien = body.get("tongTien") != null
                ? BigDecimal.valueOf(((Number) body.get("tongTien")).doubleValue())
                : BigDecimal.ZERO;
        Integer maNguoiDung = body.get("maNguoiDung") != null
                ? Integer.valueOf(body.get("maNguoiDung").toString())
                : null;
        java.util.List<Integer> productIds = body.get("maSanPhamIds") instanceof java.util.List<?> ids
                ? ids.stream().map(i -> Integer.valueOf(i.toString())).toList() : java.util.List.of();
        Map<Integer, BigDecimal> productSubtotals = new LinkedHashMap<>();
        if (body.get("items") instanceof java.util.List<?> items) {
            for (Object raw : items) {
                if (!(raw instanceof Map<?, ?> item) || item.get("maSanPham") == null || item.get("thanhTien") == null)
                    continue;
                Integer productId = Integer.valueOf(item.get("maSanPham").toString());
                BigDecimal subtotal = new BigDecimal(item.get("thanhTien").toString());
                if (subtotal.signum() < 0) throw new BadRequestException("Thành tiền sản phẩm không hợp lệ");
                productSubtotals.merge(productId, subtotal, BigDecimal::add);
            }
        }
        if (maCode == null || maCode.isBlank()) throw new BadRequestException("Vui lòng nhập mã giảm giá");
        return ResponseEntity.ok(posService.validateCoupon(maCode, maNguoiDung, tongTien, productIds,
                productSubtotals.isEmpty() ? null : productSubtotals));
    }

    @PostMapping("/best-coupon")
    public ResponseEntity<?> getBestCoupon(@RequestBody Map<String, Object> body) {
        BigDecimal tongTien = body.get("tongTien") != null
                ? new BigDecimal(body.get("tongTien").toString())
                : BigDecimal.ZERO;
        Integer maNguoiDung = body.get("maNguoiDung") != null
                ? Integer.valueOf(body.get("maNguoiDung").toString())
                : null;
        java.util.List<Integer> productIds = body.get("maSanPhamIds") instanceof java.util.List<?> ids
                ? ids.stream().map(i -> Integer.valueOf(i.toString())).toList() : java.util.List.of();
        Map<Integer, BigDecimal> productSubtotals = new LinkedHashMap<>();
        if (body.get("items") instanceof java.util.List<?> items) {
            for (Object raw : items) {
                if (!(raw instanceof Map<?, ?> item) || item.get("maSanPham") == null || item.get("thanhTien") == null)
                    continue;
                Integer productId = Integer.valueOf(item.get("maSanPham").toString());
                BigDecimal subtotal = new BigDecimal(item.get("thanhTien").toString());
                if (subtotal.signum() < 0) throw new BadRequestException("Thành tiền sản phẩm không hợp lệ");
                productSubtotals.merge(productId, subtotal, BigDecimal::add);
            }
        }
        return ResponseEntity.ok(posService.getBestCoupon(maNguoiDung, tongTien, productIds,
                productSubtotals.isEmpty() ? null : productSubtotals));
    }

    @PostMapping("/orders")
    public ResponseEntity<?> createOrder(Authentication auth, @Valid @RequestBody PosOrderRequest request) {
        return ResponseEntity.ok(posService.createPosOrder(request, userService.getUserIdFromAuth(auth)));
    }

    @PostMapping("/cart/heartbeat")
    public ResponseEntity<?> heartbeat(Authentication auth, @RequestParam String checkoutKey) {
        posCartService.heartbeat(userService.getUserIdFromAuth(auth), checkoutKey);
        return ResponseEntity.ok(Map.of("message", "OK"));
    }

    @GetMapping("/cart")
    public ResponseEntity<?> getCart(Authentication auth, @RequestParam String checkoutKey) {
        return ResponseEntity.ok(posCartService.getCart(userService.getUserIdFromAuth(auth), checkoutKey));
    }

    @PutMapping("/cart")
    public ResponseEntity<?> replaceCart(Authentication auth, @Valid @RequestBody PosDraftRequest request) {
        return ResponseEntity.ok(posCartService.replace(userService.getUserIdFromAuth(auth), request));
    }

    @GetMapping("/cart/availability")
    public ResponseEntity<?> availability(@RequestParam java.util.List<Integer> ids) {
        return ResponseEntity.ok(posCartService.availability(ids));
    }

    @DeleteMapping("/cart")
    public ResponseEntity<?> clearCart(Authentication auth, @RequestParam String checkoutKey) {
        posCartService.clearCart(userService.getUserIdFromAuth(auth), checkoutKey);
        return ResponseEntity.ok(Map.of("message", "Cart cleared"));
    }

    @GetMapping("/scan")
    public ResponseEntity<?> scanSku(@RequestParam String sku) {
        BienTheSanPham v = bienTheRepository.findBySkuIgnoreCase(sku.trim())
            .orElseThrow(() -> new BadRequestException("Không tìm thấy sản phẩm với mã: " + sku));
        campaignDiscountService.applyToVariants(java.util.List.of(v));
        BigDecimal giaGoc = v.getGia() != null ? v.getGia() : BigDecimal.ZERO;
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("maBienThe", v.getMaBienThe());
        result.put("maSanPham", v.getSanPham().getMaSanPham());
        result.put("tenSanPham", v.getSanPham().getTenSanPham());
        result.put("kichCo", v.getKichCo() != null ? v.getKichCo().getKichCo() : "");
        result.put("mauSac", v.getMauSac() != null ? v.getMauSac().getMauSac() : "");
        result.put("gia", CampaignDiscountService.discountedPrice(giaGoc, v.getPhanTramGiamGia()));
        result.put("giaGoc", giaGoc);
        result.put("phanTramGiamGia", v.getPhanTramGiamGia());
        result.put("tonKho", v.getTonKho());
        result.put("sku", v.getSku());
        result.put("maSanPhamCode", v.getSanPham().getMaSanPhamCode());
        result.put("urlAnh", v.getUrlAnh());
        return ResponseEntity.ok(result);
    }

    @PostMapping("/vietqr/preview")
    public ResponseEntity<?> previewVietQr(@RequestBody Map<String, Object> body) {
        Object rawAmount = body == null ? null : body.get("amount");
        if (!(rawAmount instanceof Number)) {
            throw new BadRequestException("Số tiền thanh toán QR không hợp lệ");
        }
        BigDecimal amount;
        try {
            amount = new BigDecimal(rawAmount.toString());
        } catch (NumberFormatException ex) {
            throw new BadRequestException("Số tiền thanh toán QR không hợp lệ");
        }
        if (amount.signum() <= 0 || amount.scale() > 2) {
            throw new BadRequestException("Số tiền thanh toán QR phải lớn hơn 0");
        }
        PaymentConfig.VietQrConfig config = paymentConfig.getVietqr();
        String reference = body.get("reference") == null ? "" : body.get("reference").toString().trim();
        if (reference.length() > 64 || !reference.matches("[A-Za-z0-9_-]*")) {
            throw new BadRequestException("Mã tham chiếu QR không hợp lệ");
        }
        String addInfo = URLEncoder.encode(
                reference.isBlank() ? "Thanh toan tai quay ZestStore" : "ZestStore POS " + reference,
                StandardCharsets.UTF_8);
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
        if (!Integer.valueOf(2).equals(payment.getDonHang().getLoaiDonHang())
                || !Integer.valueOf(6).equals(payment.getPhuongThuc()))
            throw new BadRequestException("Chỉ xác nhận chuyển khoản của đơn tại quầy");
        if (Integer.valueOf(2).equals(payment.getTrangThaiThanhToan())) {
            return ResponseEntity.ok(Map.of("message", "Đã thanh toán trước đó"));
        }
        thanhToanService.completePayment(payment.getMaThanhToan(), "POS-" + System.currentTimeMillis());
        return ResponseEntity.ok(Map.of("message", "Xác nhận thanh toán thành công"));
    }
}
