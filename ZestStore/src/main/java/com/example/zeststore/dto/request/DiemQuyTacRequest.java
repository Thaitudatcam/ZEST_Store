package com.example.zeststore.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DiemQuyTacRequest {

    @NotNull @Min(1)
    private Integer tiLeTich;

    @NotNull @Min(1)
    private Integer tiLeDoi;

    @NotNull @Min(1)
    private Integer thoiHanThang;

    @NotNull @Min(0)
    private Integer diemToiThieu;

    @NotNull @Min(0) @Max(100)
    private Integer giamToiDaPhanTram;

    @NotNull
    private Boolean tichTienMat;
}
