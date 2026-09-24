package com.example.zeststore.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class RefundRequest {
    @NotBlank(message = "Vui lòng nhập mã giao dịch hoàn tiền")
    @Size(max = 100, message = "Mã giao dịch hoàn tiền không được vượt quá 100 ký tự")
    private String maGiaoDichHoanTien;

    @Size(max = 350, message = "Ghi chú không được vượt quá 350 ký tự")
    private String ghiChu;
}
