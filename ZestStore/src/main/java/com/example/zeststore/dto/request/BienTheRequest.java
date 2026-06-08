package com.example.zeststore.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.*;
import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BienTheRequest {
    @NotBlank
    private String sku;

    @NotBlank
    private String kichCo;

    @NotBlank
    private String mauSac;

    @NotNull @PositiveOrZero
    private BigDecimal gia;

    @PositiveOrZero
    private Integer tonKho;

    private String urlAnh;
}
