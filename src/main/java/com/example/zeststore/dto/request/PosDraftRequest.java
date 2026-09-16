package com.example.zeststore.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.*;
import java.util.List;
import com.example.zeststore.dto.request.PosOrderRequest.PosItem;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class PosDraftRequest {
    @NotBlank @Size(max = 64)
    private String checkoutKey;
    @NotNull @Size(max = 200)
    private List<@NotNull @Valid PosItem> items;
}
