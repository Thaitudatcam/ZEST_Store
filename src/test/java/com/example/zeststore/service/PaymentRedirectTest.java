package com.example.zeststore.service;

import com.example.zeststore.config.PaymentConfig;
import com.example.zeststore.entity.ThanhToan;
import com.example.zeststore.repository.ThanhToanRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.web.client.RestTemplate;
import java.math.BigDecimal;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class PaymentRedirectTest {
    @Test void mismatchedGatewayAmountRedirectsForReviewWithoutSettling() {
        var config = new PaymentConfig(); config.getZalopay().setAppId(2553);
        var repository = mock(ThanhToanRepository.class);
        var payments = mock(ThanhToanService.class);
        var payment = ThanhToan.builder().maThanhToan(171).phuongThuc(4)
            .soTien(new BigDecimal("324909.80"))
            .donHang(com.example.zeststore.entity.DonHang.builder().maDonHang(12).build()).build();
        when(repository.findById(171)).thenReturn(Optional.of(payment));
        var service = spy(new ZaloPayService(config, repository, payments, mock(ThongBaoService.class), mock(RestTemplate.class), new ObjectMapper()));
        doReturn(new HashMap<>(Map.of("return_code", 1, "amount", 324909, "zp_trans_id", 123L)))
            .when(service).queryOrder("260925_P171_123");
        assertEquals("http://localhost:5173/payment/result?orderId=12&review=amount",
            service.handleReturn(Map.of("apptransid", "260925_P171_123")));
        verifyNoInteractions(payments);
    }
    @Test void fractionalAmountIsNotSilentlyTruncatedWhenCreatingPayment() {
        var repository = mock(ThanhToanRepository.class);
        when(repository.findByDonHang_MaDonHangAndTrangThaiThanhToan(123, 1)).thenReturn(Optional.of(
            ThanhToan.builder().maThanhToan(10).phuongThuc(4).soTien(new BigDecimal("324909.80")).build()));
        var client = mock(RestTemplate.class);
        var service = new ZaloPayService(new PaymentConfig(), repository, mock(ThanhToanService.class), mock(ThongBaoService.class), client, new ObjectMapper());
        assertThrows(com.example.zeststore.exception.BadRequestException.class, () -> service.createOrder(123));
        verifyNoInteractions(client);
    }
    @Test void localhostReturnIsRejectedBeforeContactingGateway() {
        var config = new PaymentConfig();
        var repository = mock(ThanhToanRepository.class);
        when(repository.findByDonHang_MaDonHangAndTrangThaiThanhToan(123, 1)).thenReturn(Optional.of(
            ThanhToan.builder().maThanhToan(10).phuongThuc(4).soTien(BigDecimal.TEN).build()));
        var client = mock(RestTemplate.class);
        var service = new ZaloPayService(config, repository, mock(ThanhToanService.class), mock(ThongBaoService.class), client, new ObjectMapper());
        var error = assertThrows(com.example.zeststore.exception.BadRequestException.class, () -> service.createOrder(123));
        assertTrue(error.getMessage().contains("HTTPS"));
        verifyNoInteractions(client);
    }
    @Test void vnpayUsesAQueryStringNotAnInvalidPath() {
        var vn = mock(VnPayService.class);
        var service = new PaymentService(vn, mock(ZaloPayService.class), new PaymentConfig());
        when(vn.processIpn(any())).thenReturn(new VnPayService.IpnResult("00", "Confirm Success", 123));
        assertEquals("http://localhost:5173/payment/result?orderId=123", service.handleVnPayReturn(Map.of()));
    }

    @Test void vnpayBrowserReturnProcessesSignedResultAsLocalhostFallback() {
        var vn = mock(VnPayService.class);
        var service = new PaymentService(vn, mock(ZaloPayService.class), new PaymentConfig());
        var params = Map.of("vnp_TxnRef", "ORD-123-abc", "vnp_SecureHash", "signed");
        when(vn.processIpn(params)).thenReturn(new VnPayService.IpnResult("00", "Confirm Success", 123));

        assertEquals("http://localhost:5173/payment/result?orderId=123", service.handleVnPayReturn(params));
        verify(vn).processIpn(params);
    }

    @Test void vnpayAmountMismatchRedirectsToReview() {
        var vn = mock(VnPayService.class);
        var service = new PaymentService(vn, mock(ZaloPayService.class), new PaymentConfig());
        when(vn.processIpn(any())).thenReturn(new VnPayService.IpnResult("04", "Invalid amount", 123));

        assertEquals("http://localhost:5173/payment/result?orderId=123&review=amount",
                service.handleVnPayReturn(Map.of()));
    }
    @Test void explicitZaloReturnIsIndependentOfServerCallback() {
        var config = new PaymentConfig();
        config.setNgrokUrl("https://callback.example");
        config.getZalopay().setReturnUrl("https://shop.example/api/payments/zalopay/return");
        assertEquals("https://shop.example/api/payments/zalopay/return", config.getZalopayReturnUrl());
        assertEquals("https://callback.example/api/payments/zalopay/callback", config.getZalopayCallbackUrl());
    }
    @Test void zaloCreateUsesEffectiveCallbackAndNonemptyReturnUrl() throws Exception {
        var config = new PaymentConfig();
        config.setNgrokUrl("https://callback.example");
        config.getZalopay().setAppId(2553);
        config.getZalopay().setKey1("test-only-key");
        config.getZalopay().setEndpoint("https://gateway.example/create");
        config.getZalopay().setCallbackUrl("http://localhost:8080/api/payments/zalopay/callback");
        var repository = mock(ThanhToanRepository.class);
        when(repository.findByDonHang_MaDonHangAndTrangThaiThanhToan(123, 1)).thenReturn(Optional.of(
            ThanhToan.builder().maThanhToan(10).phuongThuc(4).soTien(BigDecimal.TEN).build()));
        var client = mock(RestTemplate.class);
        when(client.postForObject(anyString(), any(), eq(Map.class))).thenReturn(Map.of("return_code", 1, "order_url", "https://gateway.example/pay"));
        var mapper = new ObjectMapper();
        var service = new ZaloPayService(config, repository, mock(ThanhToanService.class), mock(ThongBaoService.class), client, mapper);
        service.createOrder(123);
        var payload = ArgumentCaptor.forClass(Map.class);
        verify(client).postForObject(eq("https://gateway.example/create"), payload.capture(), eq(Map.class));
        assertEquals("https://callback.example/api/payments/zalopay/callback", payload.getValue().get("callback_url"));
        var embed = mapper.readValue((String)payload.getValue().get("embed_data"), Map.class);
        assertEquals("https://callback.example/api/payments/zalopay/return", embed.get("redirecturl"));
        assertEquals(123, embed.get("orderId"));
    }
}
