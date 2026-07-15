package com.example.zeststore.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.PositiveOrZero;
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
}
