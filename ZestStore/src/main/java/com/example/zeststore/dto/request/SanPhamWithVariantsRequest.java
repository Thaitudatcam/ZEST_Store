package com.example.zeststore.dto.request;

import jakarta.validation.Valid;
import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SanPhamWithVariantsRequest {
    @Valid
    private SanPhamRequest product;

    @Valid
    private List<BienTheRequest> variants;
}
