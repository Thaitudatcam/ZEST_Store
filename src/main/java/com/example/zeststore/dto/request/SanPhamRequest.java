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
public class SanPhamRequest {
    @NotNull
    private Integer maDanhMuc;

    @NotBlank
    private String tenSanPham;

    @NotBlank
    private String slug;

    private String moTa;
    private String moTaAi;

    private String urlAnhDaiDien;

    private String xuatXu;

    private Integer maLoaiAo;
    private Integer maKieuDang;
    private Integer maChatLieu;
    private Integer maCoAo;
    private Integer maTayAo;
    private Integer maVaiAo;

    private Integer trangThai;
}