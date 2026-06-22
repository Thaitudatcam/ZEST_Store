package com.example.zeststore.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CategoryRequest {
    @NotBlank @Size(max = 100)
    private String tenDanhMuc;

    @Size(max = 200)
    private String slug;

    private Integer maDanhMucCha;
}
