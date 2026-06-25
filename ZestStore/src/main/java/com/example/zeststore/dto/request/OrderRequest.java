package com.example.zeststore.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import lombok.*;
import java.math.BigDecimal;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderRequest {

    @NotBlank @Size(max = 100)
    private String tenNguoiNhan;

    @NotBlank @Pattern(regexp = "^[0-9]{10,11}$", message = "Số điện thoại phải có 10-11 chữ số") @Size(max = 15)
    private String sdtNguoiNhan;

    @NotBlank @Size(max = 500)
    private String diaChiGiaoHang;

    private String ghiChu;

    private String maCode;

    @NotNull
    private Integer phuongThucThanhToan;

    @PositiveOrZero
    private BigDecimal phiVanChuyen;

    private List<Integer> maBienTheList;
}