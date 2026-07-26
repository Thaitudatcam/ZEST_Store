package com.example.zeststore.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class QuenMatKhauRequest {
    @NotBlank @Email
    private String email;
}
