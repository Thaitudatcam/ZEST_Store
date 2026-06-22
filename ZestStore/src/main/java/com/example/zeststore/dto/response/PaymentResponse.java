package com.example.zeststore.dto.response;

import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentResponse {
    private String paymentUrl;
    private Integer orderId;
    private BigDecimal amount;
    private String message;
}
