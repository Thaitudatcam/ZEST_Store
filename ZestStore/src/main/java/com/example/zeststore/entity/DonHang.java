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

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ma_don_hang")
    private Integer maDonHang;

    @Column(name = "ma_don_hang_code", length = 20, unique = true)
    private String maDonHangCode;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ma_nguoi_dung", nullable = false)
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
    private List<ThanhToan> thanhToans;

    @OneToMany(mappedBy = "donHang")
    @ToString.Exclude
    @JsonIgnore
    private List<DanhGia> danhGias;

    @OneToOne(mappedBy = "donHang", cascade = CascadeType.ALL)
    @ToString.Exclude
    @JsonIgnore
    private HoaDon hoaDon;

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
    }

    @PreUpdate
    protected void onUpdate() {
        this.ngayCapNhat = LocalDateTime.now();
    }
}