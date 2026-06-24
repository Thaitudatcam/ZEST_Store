package com.example.zeststore.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DiaChiRequest {
    @NotBlank @Size(max = 100)
    private String tenNguoiNhan;

    @NotBlank @Size(max = 15)
    private String soDienThoai;

    @Size(max = 100)
    private String tinhThanhPho;

    @Size(max = 100)
    private String quanHuyen;

    @NotBlank @Size(max = 500)
    private String chiTietDiaChi;

    private Boolean laMacDinh;
}
