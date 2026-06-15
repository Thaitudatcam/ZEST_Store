package com.example.zeststore.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
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

    private Integer trangThai;
}