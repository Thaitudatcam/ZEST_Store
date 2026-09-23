package com.example.zeststore.service;

import com.example.zeststore.repository.DonHangRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
public class CodOrderExpiryJob {

    private final DonHangRepository donHangRepository;
    private final DonHangService donHangService;
    private final long expiryHours;

    public CodOrderExpiryJob(DonHangRepository donHangRepository,
                             DonHangService donHangService,
                             @Value("${orders.cod.auto-cancel-after-hours:24}") long expiryHours) {
        if (expiryHours <= 0) {
            throw new IllegalArgumentException("orders.cod.auto-cancel-after-hours must be greater than zero");
        }
        this.donHangRepository = donHangRepository;
        this.donHangService = donHangService;
        this.expiryHours = expiryHours;
    }

    @Scheduled(fixedDelayString = "${orders.cod.auto-cancel-check-ms:300000}")
    public void autoCancelExpiredCodOrders() {
        LocalDateTime threshold = LocalDateTime.now().minusHours(expiryHours);
        List<Integer> expiredIds = donHangRepository.findExpiredPendingCodOrderIds(threshold);
        int cancelled = 0;
        for (Integer orderId : expiredIds) {
            try {
                if (donHangService.autoCancelExpiredCodOrder(orderId, threshold)) cancelled++;
            } catch (RuntimeException ex) {
                log.error("Không thể tự hủy đơn COD quá hạn #{}; cần kiểm tra thủ công", orderId, ex);
            }
        }
        if (cancelled > 0) {
            log.info("Đã tự động hủy {} đơn COD chờ xác nhận quá {} giờ", cancelled, expiryHours);
        }
    }
}
