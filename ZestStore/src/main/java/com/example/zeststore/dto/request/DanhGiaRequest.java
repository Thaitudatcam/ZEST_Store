package com.example.zeststore.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DanhGiaRequest {
    private Integer maSanPham;

    private Integer maDonHang;

    private Integer maBienThe;

    @NotNull @Min(1) @Max(5)
    private Integer soSao;

    private String binhLuan;
}
