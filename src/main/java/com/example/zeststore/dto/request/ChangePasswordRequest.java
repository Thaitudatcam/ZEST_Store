package com.example.zeststore.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChangePasswordRequest {
    @NotBlank
    private String matKhauCu;

    @NotBlank @Size(min = 6)
    private String matKhauMoi;
}
