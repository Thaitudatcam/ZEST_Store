package com.example.zeststore.service;

import com.example.zeststore.config.PaymentConfig;
import com.example.zeststore.entity.ThanhToan;
import com.example.zeststore.repository.ThanhToanRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.Optional;
import java.util.TreeMap;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.*;

class VnPayCallbackTest {
    private static final String SECRET = "test-secret";
    private PaymentConfig config;
    private ThanhToanRepository repository;
    private ThanhToanService thanhToanService;
    private VnPayService service;

    @BeforeEach
    void setUp() {
        config = new PaymentConfig();
        config.getVnpay().setHashSecret(SECRET);
        config.getVnpay().setTmnCode("ZEST01");
        repository = mock(ThanhToanRepository.class);
        thanhToanService = mock(ThanhToanService.class);
        service = new VnPayService(config, repository, thanhToanService, mock(ThongBaoService.class));
    }

    @Test
    void validGetIpnChecksAmountMethodAndTransactionStatus() throws Exception {
        ThanhToan payment = ThanhToan.builder().maThanhToan(7).maGiaoDich("ORD-12-abc")
                .phuongThuc(2).soTien(new BigDecimal("199000")).trangThaiThanhToan(1).build();
        when(repository.findByMaGiaoDich("ORD-12-abc")).thenReturn(Optional.of(payment));
        when(thanhToanService.completePaymentWithResult(7, "9988"))
                .thenReturn(new ThanhToanService.PaymentTransition(payment, true, false));

        VnPayService.IpnResult result = service.processIpn(signedParams("19900000", "00"));

        assertEquals("00", result.rspCode());
        verify(thanhToanService).completePaymentWithResult(7, "9988");
    }

    @Test
    void mismatchedAmountIsRejectedWithoutCompletingPayment() throws Exception {
        ThanhToan payment = ThanhToan.builder().maThanhToan(7).maGiaoDich("ORD-12-abc")
                .phuongThuc(2).soTien(new BigDecimal("199000")).trangThaiThanhToan(1).build();
        when(repository.findByMaGiaoDich("ORD-12-abc")).thenReturn(Optional.of(payment));

        VnPayService.IpnResult result = service.processIpn(signedParams("10000", "00"));

        assertEquals("04", result.rspCode());
        verifyNoInteractions(thanhToanService);
    }

    private Map<String, String> signedParams(String amount, String transactionStatus) throws Exception {
        Map<String, String> params = new TreeMap<>();
        params.put("vnp_Amount", amount);
        params.put("vnp_ResponseCode", "00");
        params.put("vnp_TmnCode", "ZEST01");
        params.put("vnp_TransactionNo", "9988");
        params.put("vnp_TransactionStatus", transactionStatus);
        params.put("vnp_TxnRef", "ORD-12-abc");
        String data = params.entrySet().stream()
                .map(e -> e.getKey() + "=" + URLEncoder.encode(e.getValue(), StandardCharsets.UTF_8))
                .reduce((a, b) -> a + "&" + b).orElse("");
        Mac mac = Mac.getInstance("HmacSHA512");
        mac.init(new SecretKeySpec(SECRET.getBytes(StandardCharsets.UTF_8), "HmacSHA512"));
        StringBuilder hash = new StringBuilder();
        for (byte b : mac.doFinal(data.getBytes(StandardCharsets.UTF_8))) hash.append(String.format("%02x", b));
        params.put("vnp_SecureHash", hash.toString());
        return params;
    }
}
