package com.example.zeststore.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

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

    @Column(name = "kieu_giam_gia", nullable = false, columnDefinition = "TINYINT")
    private Integer kieuGiamGia;

    @NotNull @PositiveOrZero
    @Column(name = "gia_tri_giam", nullable = false, precision = 18, scale = 2)
    private BigDecimal giaTriGiam;

    @PositiveOrZero
    @Column(name = "gia_tri_don_toi_thieu", precision = 18, scale = 2)
    private BigDecimal giaTriDonToiThieu;

    @Column(name = "ngay_bat_dau")
    private LocalDateTime ngayBatDau;

    @Column(name = "ngay_ket_thuc")
    private LocalDateTime ngayKetThuc;

    @Column(name = "trang_thai", nullable = false, columnDefinition = "TINYINT")
    @Builder.Default
    private Integer trangThai = 1;

    @Column(name = "ngay_tao", nullable = false, updatable = false)
    private LocalDateTime ngayTao;

    @Column(name = "ngay_xoa")
    private LocalDateTime ngayXoa;

    @PositiveOrZero
    @Column(name = "so_luong")
    private Integer soLuong;

    @PositiveOrZero
    @Column(name = "gia_tri_giam_toi_da", precision = 18, scale = 2)
    private BigDecimal giaTriGiamToiDa;

    @Column(name = "exclusive", nullable = false)
    @Builder.Default
    private Boolean exclusive = false;

    @Column(name = "cong_khai")
    @Builder.Default
    private Boolean congKhai = false;

    @Column(name = "loai_phat_hanh", nullable = false, columnDefinition = "TINYINT")
    @Builder.Default
    private Integer loaiPhatHanh = 1;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ma_dot")
    @ToString.Exclude
    private DotPhatHanh dotPhatHanh;

    @ManyToMany
    @JoinTable(name = "coupon_danh_muc",
        joinColumns = @JoinColumn(name = "ma_phieu_giam_gia"),
        inverseJoinColumns = @JoinColumn(name = "ma_danh_muc"))
    @JsonIgnoreProperties({"sanPhams", "danhMucCons", "danhMucCha"})
    @Builder.Default
    private Set<DanhMuc> danhMucApDung = new HashSet<>();

    @ManyToMany
    @JoinTable(name = "coupon_san_pham",
        joinColumns = @JoinColumn(name = "ma_phieu_giam_gia"),
        inverseJoinColumns = @JoinColumn(name = "ma_san_pham"))
    @JsonIgnoreProperties({"danhMuc", "bienTheSanPhams", "danhGias", "hinhAnhs", "mucYeuThichs", "hanhVis"})
    @Builder.Default
    private Set<SanPham> sanPhamApDung = new HashSet<>();

    @OneToMany(mappedBy = "phieuGiamGia")
    @ToString.Exclude
    @com.fasterxml.jackson.annotation.JsonIgnore
    private java.util.List<DonHang> donHangs;

    @Transient
    @com.fasterxml.jackson.annotation.JsonProperty("trangThaiThucTe")
    public int getTrangThaiThucTe() {
        if (ngayXoa != null) return 5;
        if (trangThai == 0) return 0;
        if (ngayBatDau != null && ngayBatDau.isAfter(LocalDateTime.now())) return 1;
        if (ngayKetThuc != null && ngayKetThuc.isBefore(LocalDateTime.now())) return 4;
        if (soLuong != null && soLuong <= 0) return 3;
        return 2;
    }

    @Transient
    @com.fasterxml.jackson.annotation.JsonProperty("trangThaiThucTeText")
    public String getTrangThaiThucTeText() {
        return switch (getTrangThaiThucTe()) {
            case 0 -> "Đã huỷ";
            case 1 -> "Chưa bắt đầu";
            case 2 -> "Đang hoạt động";
            case 3 -> "Hết lượt";
            case 4 -> "Hết hạn";
            case 5 -> "Đã xoá";
            default -> "Không xác định";
        };
    }

    @PrePersist
    protected void onCreate() {
        this.ngayTao = LocalDateTime.now();
        if (this.trangThai == null) this.trangThai = 1;
        if (this.kieuGiamGia == null) this.kieuGiamGia = 1;
    }
}
