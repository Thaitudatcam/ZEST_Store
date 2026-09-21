package com.example.zeststore.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CouponResponse {
    private Integer maPhieuGiamGia;
    private String maCode;
    private LocalDateTime ngayTao;
    private Integer kieuGiamGia;
    private BigDecimal giaTriGiam;
    private BigDecimal giaTriDonToiThieu;
    private LocalDateTime ngayBatDau;
    private LocalDateTime ngayKetThuc;
    private Integer trangThai;
    private Integer trangThaiThucTe;
    private String trangThaiThucTeText;
    private Integer soLuong;
    private BigDecimal giaTriGiamToiDa;
    private Boolean exclusive;
    private Boolean congKhai;
    private List<CategoryInfo> danhMucApDung;
    private List<ProductInfo> sanPhamApDung;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CategoryInfo {
        private Integer maDanhMuc;
        private String tenDanhMuc;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ProductInfo {
        private Integer maSanPham;
        private String tenSanPham;
    }
}
