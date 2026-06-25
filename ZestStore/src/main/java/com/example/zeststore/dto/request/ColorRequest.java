package com.example.zeststore.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ColorRequest {
    @NotBlank @Size(max = 50)
    private String tenMauSac;

    @Size(max = 7)
    private String maMauHex;
}
