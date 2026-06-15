package com.example.zeststore.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CouponRequest {
    @NotBlank
    private String maCode;

    @NotNull
    private Integer kieuGiamGia;

    @NotNull @Positive
    private BigDecimal giaTriGiam;

    private BigDecimal giaTriDonToiThieu;

    @NotNull
    private LocalDateTime ngayBatDau;

    @NotNull
    private LocalDateTime ngayKetThuc;

    private Integer trangThai;
}