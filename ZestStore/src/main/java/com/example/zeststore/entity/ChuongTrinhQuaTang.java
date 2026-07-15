package com.example.zeststore.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

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

    @Column(name = "ten_chuong_trinh", nullable = false, length = 200)
    private String tenChuongTrinh;

    @Enumerated(EnumType.ORDINAL)
    @Column(name = "loai_trigger", nullable = false, columnDefinition = "TINYINT")
    private LoaiTrigger loaiTrigger;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ma_phieu_giam_gia", nullable = false)
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

    @Column(name = "da_chay_xong")
    @Builder.Default
    private Boolean daChayXong = false;

    @Column(name = "trang_thai", nullable = false, columnDefinition = "TINYINT")
    @Builder.Default
    private Integer trangThai = 1;

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
