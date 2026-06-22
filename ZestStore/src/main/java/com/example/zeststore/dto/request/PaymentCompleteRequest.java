package com.example.zeststore.dto.request;

import jakarta.validation.constraints.Size;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentCompleteRequest {
    @Size(max = 200)
    private String maGiaoDich;
}
