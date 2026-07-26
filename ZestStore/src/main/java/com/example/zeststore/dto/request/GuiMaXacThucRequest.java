package com.example.zeststore.dto.request;

import jakarta.validation.constraints.Email;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class GuiMaXacThucRequest {
    @Email
    private String emailMoi;
}
