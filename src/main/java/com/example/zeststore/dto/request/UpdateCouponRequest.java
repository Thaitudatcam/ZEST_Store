package com.example.zeststore.dto.request;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateCouponRequest {
    private BigDecimal giaTriGiam;
    private BigDecimal giaTriDonToiThieu;
    private LocalDateTime ngayBatDau;
    private LocalDateTime ngayKetThuc;
    private Integer trangThai;
    private Integer soLuong;
    private Boolean xoaGioiHanSoLuong;
    private BigDecimal giaTriGiamToiDa;
    private Boolean exclusive;
    private Boolean congKhai;
    private List<Integer> maDanhMucIds;
    private List<Integer> maSanPhamIds;
}
