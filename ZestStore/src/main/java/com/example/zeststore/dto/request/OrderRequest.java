package com.example.zeststore.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;
import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderRequest {

    @NotBlank @Size(max = 100)
    private String tenNguoiNhan;

    @NotBlank @Size(max = 15)
    private String sdtNguoiNhan;

    @NotBlank @Size(max = 500)
    private String diaChiGiaoHang;

    private String ghiChu;

    private String maCode;

    @NotNull
    private Integer phuongThucThanhToan;

    private BigDecimal phiVanChuyen;
}