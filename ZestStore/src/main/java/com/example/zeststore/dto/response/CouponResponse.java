package com.example.zeststore.dto.response;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CouponResponse {
    @NotBlank
    private String maCode;

    @NotNull
    private Integer kieuGiamGia;

    @NotNull @Positive
    private BigDecimal giaTriGiam;

    private BigDecimal giaTriDonToiThieu;

    @NotNull @FutureOrPresent
    private LocalDateTime ngayBatDau;

    @NotNull @Future
    private LocalDateTime ngayKetThuc;

    private Integer trangThai;

    private Integer soLuong;

    private BigDecimal giaTriGiamToiDa;
}
