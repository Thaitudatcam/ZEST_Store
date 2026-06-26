package com.example.zeststore.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import lombok.*;
import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PhiVanChuyenRequest {

    @NotBlank @Size(max = 100)
    private String tenTinh;

    @NotNull @PositiveOrZero
    private BigDecimal phiVanChuyen;
}
