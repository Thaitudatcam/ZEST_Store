package com.example.zeststore.entity;

import jakarta.persistence.*;
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
@Table(name = "chuong_trinh_qua_tang")
public class ChuongTrinhQuaTang {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ma_chuong_trinh")
    private Integer maChuongTrinh;

    @Column(name = "ten_chuong_trinh", nullable = false, length = 200, columnDefinition = "NVARCHAR(200)")
    private String tenChuongTrinh;

    @Enumerated(EnumType.ORDINAL)
    @Column(name = "loai_trigger", nullable = false, columnDefinition = "TINYINT")
    private LoaiTrigger loaiTrigger;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ma_phieu_giam_gia", nullable = true)
    private PhieuGiamGia phieuGiamGia;

    @Column(name = "so_ngay_khong_hoat_dong")
    private Integer soNgayKhongHoatDong;

    @Enumerated(EnumType.ORDINAL)
    @Column(name = "doi_tuong", columnDefinition = "TINYINT")
    private DoiTuongEnum doiTuong;

    @Enumerated(EnumType.ORDINAL)
    @Column(name = "dieu_kien", columnDefinition = "TINYINT")
    private DieuKienEnum dieuKien;

    @Column(name = "ngay_bat_dau")
    private LocalDateTime ngayBatDau;

    @Column(name = "ngay_ket_thuc")
    private LocalDateTime ngayKetThuc;

    @Column(name = "da_chay_xong")
    @Builder.Default
    private Boolean daChayXong = false;

    @Column(name = "trang_thai", nullable = false, columnDefinition = "TINYINT")
    @Builder.Default
    private Integer trangThai = 1;

    // Giá trị giảm giá theo đợt (thay cho "đối tượng" ở form mới)
    // kieuGiamGia: 1 = %, 2 = tiền mặt
    @Column(name = "kieu_giam_gia", columnDefinition = "TINYINT")
    private Integer kieuGiamGia;

    @Column(name = "gia_tri_giam", precision = 18, scale = 2)
    private BigDecimal giaTriGiam;

    // Sản phẩm được chọn giảm giá theo đợt
    @ManyToMany
    @JoinTable(name = "campaign_san_pham",
        joinColumns = @JoinColumn(name = "ma_chuong_trinh"),
        inverseJoinColumns = @JoinColumn(name = "ma_san_pham"))
    @Builder.Default
    private Set<SanPham> sanPhamApDung = new HashSet<>();

    // Biến thể được chọn riêng theo sản phẩm để giảm giá theo đợt
    @ManyToMany
    @JoinTable(name = "campaign_bien_the",
        joinColumns = @JoinColumn(name = "ma_chuong_trinh"),
        inverseJoinColumns = @JoinColumn(name = "ma_bien_the"))
    @Builder.Default
    private Set<BienTheSanPham> bienTheApDung = new HashSet<>();

    @Column(name = "ngay_tao", nullable = false, updatable = false)
    private LocalDateTime ngayTao;

    @Column(name = "ngay_cap_nhat")
    private LocalDateTime ngayCapNhat;

    @PrePersist
    protected void onCreate() {
        this.ngayTao = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.ngayCapNhat = LocalDateTime.now();
    }
}
