package com.example.zeststore.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "phieu_giam_gia")
public class PhieuGiamGia {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ma_phieu_giam_gia")
    private Integer maPhieuGiamGia;

    @Column(name = "ma_code", nullable = false, length = 50, unique = true)
    private String maCode;

    @Column(name = "kieu_giam_gia", nullable = false, length = 20)
    private String kieuGiamGia;

    @Column(name = "gia_tri_giam", nullable = false, precision = 18, scale = 0)
    private BigDecimal giaTriGiam;

    @Column(name = "gia_tri_don_toi_thieu", precision = 18, scale = 0)
    private BigDecimal giaTriDonToiThieu;

    @Column(name = "ngay_bat_dau", nullable = false)
    private LocalDateTime ngayBatDau;

    @Column(name = "ngay_ket_thuc", nullable = false)
    private LocalDateTime ngayKetThuc;

    @Column(name = "trang_thai", nullable = false, length = 20)
    @Builder.Default
    private String trangThai = "active";

    @Column(name = "ngay_tao", nullable = false, updatable = false)
    private LocalDateTime ngayTao;

    @Column(name = "ngay_cap_nhat")
    private LocalDateTime ngayCapNhat;

    @Column(name = "ngay_xoa")
    private LocalDateTime ngayXoa;

    @OneToMany(mappedBy = "phieuGiamGia")
    @ToString.Exclude
    private List<DonHang> donHangs;

    @PrePersist
    protected void onCreate() {
        this.ngayTao = LocalDateTime.now();
        if (this.trangThai == null) this.trangThai = "active";
    }

    @PreUpdate
    protected void onUpdate() {
        this.ngayCapNhat = LocalDateTime.now();
    }
}
