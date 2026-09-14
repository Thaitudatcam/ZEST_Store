package com.example.zeststore.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SizeRequest {
    @NotBlank @Size(max = 10)
    private String tenKichCo;
}
