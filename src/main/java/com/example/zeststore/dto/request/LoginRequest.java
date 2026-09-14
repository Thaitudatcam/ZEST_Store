package com.example.zeststore.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LoginRequest {

    @NotBlank(message = "Email hoặc số điện thoại không được để trống")
    private String email;

    @NotBlank(message = "Password is required")
    private String matKhau;
}
