package com.example.zeststore.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ReturnRequest {
    @NotBlank(message = "Vui lòng nhập lý do trả hàng")
    @Size(max = 500, message = "Lý do trả hàng không được vượt quá 500 ký tự")
    private String lyDo;
}
