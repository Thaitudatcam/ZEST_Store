package com.example.zeststore.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import com.fasterxml.jackson.annotation.JsonIgnore;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "don_hang")
public class DonHang {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ma_don_hang")
    private Integer maDonHang;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ma_nguoi_dung", nullable = false)
    private NguoiDung nguoiDung;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ma_phieu_giam_gia")
    private PhieuGiamGia phieuGiamGia;

    @Column(name = "so_tien_giam", nullable = false, precision = 18, scale = 0)
    @Builder.Default
    private BigDecimal soTienGiam = BigDecimal.ZERO;

    @Column(name = "tong_tien", nullable = false, precision = 18, scale = 0)
    private BigDecimal tongTien;

    @Column(name = "trang_thai_don", nullable = false, length = 20)
    @Builder.Default
    private String trangThaiDon = "pending";

    @Column(name = "ten_nguoi_nhan", nullable = false, length = 100)
    private String tenNguoiNhan;

    @Column(name = "sdt_nguoi_nhan", nullable = false, length = 15)
    private String sdtNguoiNhan;

    @Column(name = "dia_chi_giao_hang", nullable = false, length = 500)
    private String diaChiGiaoHang;

    @Column(name = "ghi_chu", length = 500)
    private String ghiChu;

    @Column(name = "ngay_dat", nullable = false, updatable = false)
    private LocalDateTime ngayDat;

    @Column(name = "ngay_cap_nhat")
    private LocalDateTime ngayCapNhat;

    @Column(name = "ngay_xoa")
    private LocalDateTime ngayXoa;

    @OneToMany(mappedBy = "donHang", cascade = CascadeType.ALL, orphanRemoval = true)
    @ToString.Exclude
    @JsonIgnore
    private List<MucDonHang> mucDonHangs;

    @OneToMany(mappedBy = "donHang")
    @ToString.Exclude
    @JsonIgnore
    private List<ThanhToan> thanhToans;

    @OneToMany(mappedBy = "donHang")
    @ToString.Exclude
    @JsonIgnore
    private List<DanhGia> danhGias;

    @OneToOne(mappedBy = "donHang", cascade = CascadeType.ALL)
    @ToString.Exclude
    @JsonIgnore
    private HoaDon hoaDon;

    @PrePersist
    protected void onCreate() {
        this.ngayDat = LocalDateTime.now();
        if (this.trangThaiDon == null) this.trangThaiDon = "pending";
        if (this.soTienGiam == null) this.soTienGiam = BigDecimal.ZERO;
    }

    @PreUpdate
    protected void onUpdate() {
        this.ngayCapNhat = LocalDateTime.now();
    }
}
