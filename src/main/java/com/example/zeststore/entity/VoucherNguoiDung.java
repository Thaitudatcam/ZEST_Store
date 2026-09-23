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
@Table(name = "voucher_nguoi_dung")
public class VoucherNguoiDung {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ma_voucher_nguoi_dung")
    private Integer maVoucherNguoiDung;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ma_nguoi_dung", nullable = false)
    private NguoiDung nguoiDung;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ma_phieu_giam_gia", nullable = false)
    private PhieuGiamGia phieuGiamGia;

    @Column(name = "ngay_nhan", nullable = false, updatable = false)
    private LocalDateTime ngayNhan;

    @Column(name = "ngay_su_dung")
    private LocalDateTime ngaySuDung;

    @Column(name = "ngay_het_han")
    private LocalDateTime ngayHetHan;

    /** Số lượt còn lại của riêng khách hàng cho mã này; null = không giới hạn. */
    @Column(name = "so_luong_con_lai")
    private Integer soLuongConLai;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ma_chuong_trinh")
    private ChuongTrinhQuaTang chuongTrinhQuaTang;

    @Enumerated(EnumType.ORDINAL)
    @Column(name = "trang_thai", nullable = false, columnDefinition = "TINYINT")
    @Builder.Default
    private TrangThaiVoucher trangThai = TrangThaiVoucher.DA_NHAN;

    @PrePersist
    protected void onCreate() {
        this.ngayNhan = LocalDateTime.now();
        if (this.trangThai == null) this.trangThai = TrangThaiVoucher.DA_NHAN;
    }
}
