package com.example.zeststore.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.*;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PosOrderRequest {
    private boolean giaoHang;
    private boolean mienPhiVanChuyen;

    @Size(max = 500)
    private String diaChiGiaoHang;

    private Integer toDistrictId;
    private String toWardCode;

    @PositiveOrZero
    private java.math.BigDecimal expectedTotal;

    @Valid
    private List<PosItem> items;

    @NotBlank @Size(max = 64)
    private String checkoutKey;

    private Integer maNguoiDung;

    @Size(max = 100)
    private String tenKhachHang;

    @Size(max = 15)
    private String sdtKhachHang;

    @Size(max = 50)
    private String maCode;

    @NotNull @Min(5)
    @Max(6)
    private Integer phuongThucThanhToan;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class PosItem {
        @NotNull
        private Integer maBienThe;

        @NotNull @Min(1)
        private Integer soLuong;
    }
}
