package com.example.zeststore.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
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

    // NONE -> RESERVED -> DEDUCTED -> RELEASED. LEGACY requires stock reconciliation.
    @Column(name = "stock_state", length = 16, nullable = false)
    @Builder.Default
    private String stockState = "NONE";

    @Column(name = "checkout_key", length = 100)
    private String checkoutKey;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ma_don_hang")
    private Integer maDonHang;

    @Column(name = "ma_don_hang_code", length = 20, unique = true)
    private String maDonHangCode;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ma_nguoi_dung")
    private NguoiDung nguoiDung;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ma_phieu_giam_gia")
    private PhieuGiamGia phieuGiamGia;

    @PositiveOrZero
    @Column(name = "so_tien_giam", precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal soTienGiam = BigDecimal.ZERO;

    @PositiveOrZero
    @Column(name = "phi_van_chuyen", precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal phiVanChuyen = BigDecimal.ZERO;

    @PositiveOrZero
    @Column(name = "so_tien_giam_diem", precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal soTienGiamDiem = BigDecimal.ZERO;

    @NotNull @PositiveOrZero
    @Column(name = "tong_tien", nullable = false, precision = 18, scale = 2)
    private BigDecimal tongTien;

    @Column(name = "loai_don_hang", nullable = false, columnDefinition = "TINYINT")
    @Builder.Default
    private Integer loaiDonHang = 1;

    @Column(name = "trang_thai_don", nullable = false, columnDefinition = "TINYINT")
    @Builder.Default
    private Integer trangThaiDon = 1;

    @NotBlank @Size(max = 100)
    @Column(name = "ten_nguoi_nhan", nullable = false, length = 100)
    private String tenNguoiNhan;

    @NotBlank @Size(max = 15)
    @Column(name = "sdt_nguoi_nhan", nullable = false, length = 15)
    private String sdtNguoiNhan;

    @NotBlank @Size(max = 500)
    @Column(name = "dia_chi_giao_hang", nullable = false, length = 500)
    private String diaChiGiaoHang;

    @Column(name = "ghi_chu", length = 500)
    private String ghiChu;

    @Column(name = "ten_khach_tai_quay", length = 100)
    private String tenKhachTaiQuay;

    @Column(name = "sdt_khach_tai_quay", length = 15)
    private String sdtKhachTaiQuay;

    @Column(name = "ngay_dat", nullable = false, updatable = false)
    private LocalDateTime ngayDat;

    @Column(name = "ngay_cap_nhat")
    private LocalDateTime ngayCapNhat;

    @Column(name = "ngay_xoa")
    private LocalDateTime ngayXoa;

    @Column(name = "so_lan_in", nullable = false)
    @Builder.Default
    private Integer soLanIn = 0;

    @OneToMany(mappedBy = "donHang", cascade = CascadeType.ALL, orphanRemoval = true)
    @ToString.Exclude
    @JsonIgnore
    private List<MucDonHang> mucDonHangs;

    @OneToMany(mappedBy = "donHang")
    @ToString.Exclude
    private List<ThanhToan> thanhToans;

    @OneToMany(mappedBy = "donHang")
    @ToString.Exclude
    @JsonIgnore
    private List<DanhGia> danhGias;

    @OneToMany(mappedBy = "donHang")
    @ToString.Exclude
    @JsonIgnore
    private List<LichSuDonHang> lichSuDonHangs;

    @PrePersist
    protected void onCreate() {
        this.ngayDat = LocalDateTime.now();
        if (this.trangThaiDon == null) this.trangThaiDon = 1;
        if (this.soTienGiam == null) this.soTienGiam = BigDecimal.ZERO;
        if (this.phiVanChuyen == null) this.phiVanChuyen = BigDecimal.ZERO;
        if (this.soTienGiamDiem == null) this.soTienGiamDiem = BigDecimal.ZERO;
    }

    @PreUpdate
    protected void onUpdate() {
        this.ngayCapNhat = LocalDateTime.now();
    }
}
