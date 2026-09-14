package com.example.zeststore.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "thong_ke_ngay")
public class ThongKeNgay {

    @Id
    @Column(name = "ngay")
    private LocalDate ngay;

    @Column(name = "doanh_thu", nullable = false)
    private BigDecimal doanhThu = BigDecimal.ZERO;

    @Column(name = "so_don_moi", nullable = false)
    private Integer soDonMoi = 0;

    @Column(name = "so_don_cho_xu_ly", nullable = false)
    private Integer soDonChoXuLy = 0;

    @Column(name = "so_don_dang_giao", nullable = false)
    private Integer soDonDangGiao = 0;

    @Column(name = "so_don_cho_giao", nullable = false)
    private Integer soDonChoGiao = 0;

    @Column(name = "so_don_da_giao", nullable = false)
    private Integer soDonDaGiao = 0;

    @Column(name = "so_don_huy", nullable = false)
    private Integer soDonHuy = 0;

    @Column(name = "so_nguoi_dung_moi", nullable = false)
    private Integer soNguoiDungMoi = 0;

    @Column(name = "so_san_pham_moi", nullable = false)
    private Integer soSanPhamMoi = 0;

    @Column(name = "ngay_cap_nhat", nullable = false)
    private LocalDateTime ngayCapNhat;
}
