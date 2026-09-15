package com.example.zeststore.dto.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StatusUpdateRequest {
    @NotNull
    private Integer trangThai;

    @Size(max = 500, message = "Ghi chú không được vượt quá 500 ký tự")
    private String ghiChu;
}
