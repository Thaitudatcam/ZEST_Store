package com.example.zeststore.dto.request;

import jakarta.validation.constraints.Size;
import lombok.*;
import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserUpdateRequest {
    @Size(max = 100)
    private String hoTen;

    @Size(max = 15)
    private String soDienThoai;

    @Size(max = 500)
    private String anhDaiDien;

    private String gioiTinh;

    private LocalDate ngaySinh;
}
