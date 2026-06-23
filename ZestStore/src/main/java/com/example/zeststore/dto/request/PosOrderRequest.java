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

    private List<PosItem> items;

    private Integer maNguoiDung;

    @Size(max = 100)
    private String tenKhachHang;

    @Size(max = 15)
    private String sdtKhachHang;

    @Size(max = 50)
    private String maCode;

    @Min(5)
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

        @Min(1)
        private Integer soLuong;
    }
}
