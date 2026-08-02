package com.example.zeststore.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentStatsDTO {
    private BigDecimal totalRevenue;
    private long recentPayments;
    private long pendingPayments;
    private long failedPayments;
    private BigDecimal lastPayout;
    private BigDecimal nextPayout;
    private BigDecimal totalPayoutAmount;
}
