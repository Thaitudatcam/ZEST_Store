package com.example.zeststore.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.Valid;
import lombok.*;
import java.math.BigDecimal;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CouponValidateRequest {
    @NotBlank
    private String maCode;

    @PositiveOrZero
    private BigDecimal tongTien;

    private List<Integer> maSanPhamIds;

    @Valid
    private List<CouponItem> items;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CouponItem {
        @NotNull
        private Integer maSanPham;

        @NotNull @PositiveOrZero
        private BigDecimal thanhTien;
    }
}
