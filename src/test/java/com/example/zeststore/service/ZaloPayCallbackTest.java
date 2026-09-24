package com.example.zeststore.service;

import com.example.zeststore.config.PaymentConfig;
import com.example.zeststore.entity.ThanhToan;
import com.example.zeststore.repository.ThanhToanRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.util.Optional;

import static org.mockito.Mockito.*;

class ZaloPayCallbackTest {
    private ThanhToanRepository repository;
    private ThanhToanService thanhToanService;
    private ZaloPayService service;

    @BeforeEach
    void setUp() {
        PaymentConfig config = new PaymentConfig();
        config.getZalopay().setAppId(2553);
        repository = mock(ThanhToanRepository.class);
        thanhToanService = mock(ThanhToanService.class);
        service = new ZaloPayService(config, repository, thanhToanService, mock(ThongBaoService.class),
                mock(RestTemplate.class), new ObjectMapper());
    }

    @Test
    void officialCallbackPayloadDoesNotRequireReturnCode() {
        ThanhToan payment = ThanhToan.builder().maThanhToan(21).phuongThuc(4)
                .soTien(new BigDecimal("199000")).trangThaiThanhToan(1).build();
        when(repository.findById(21)).thenReturn(Optional.of(payment));
        when(thanhToanService.completePaymentWithResult(21, "2409240001"))
                .thenReturn(new ThanhToanService.PaymentTransition(payment, true, false));

        service.handleSuccessCallback("{\"app_id\":2553,\"app_trans_id\":\"260924_P21_123\","
                + "\"amount\":199000,\"zp_trans_id\":2409240001}");

        verify(thanhToanService).completePaymentWithResult(21, "2409240001");
    }

    @Test
    void wrongAmountNeverCompletesPayment() {
        ThanhToan payment = ThanhToan.builder().maThanhToan(21).phuongThuc(4)
                .soTien(new BigDecimal("199000")).trangThaiThanhToan(1).build();
        when(repository.findById(21)).thenReturn(Optional.of(payment));

        try {
            service.handleSuccessCallback("{\"app_id\":2553,\"app_trans_id\":\"260924_P21_123\","
                    + "\"amount\":1000,\"zp_trans_id\":2409240001}");
        } catch (RuntimeException ignored) {}

        verifyNoInteractions(thanhToanService);
    }
}
