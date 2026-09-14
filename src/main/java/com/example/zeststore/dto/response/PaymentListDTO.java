package com.example.zeststore.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentListDTO {
    private Integer maThanhToan;
    private String maGiaoDich;
    private String tenNguoiDung;
    private String emailNguoiDung;
    private Integer maDonHang;
    private String maDonHangCode;
    private String tenSanPham;
    private Integer phuongThuc;
    private LocalDateTime thoiGianTao;
    private LocalDateTime thoiGianTt;
    private BigDecimal soTien;
    private Integer trangThaiThanhToan;
}
