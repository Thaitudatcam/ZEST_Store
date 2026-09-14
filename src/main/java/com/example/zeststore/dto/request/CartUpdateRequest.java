package com.example.zeststore.dto.request;

import jakarta.validation.constraints.Positive;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CartUpdateRequest {
    @Positive
    private Integer soLuong;
}
