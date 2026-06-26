package com.example.zeststore.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PosCartRequest {

    @NotNull
    private Integer maBienThe;

    @NotNull
    @Min(1)
    private Integer soLuong;
}
