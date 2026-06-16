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
@Table(name = "lich_su_don_hang")
public class LichSuDonHang {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ma_lich_su")
    private Integer maLichSu;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ma_don_hang", nullable = false)
    private DonHang donHang;

    @Column(name = "trang_thai_cu", columnDefinition = "TINYINT")
    private Integer trangThaiCu;

    @Column(name = "trang_thai_moi", nullable = false, columnDefinition = "TINYINT")
    private Integer trangThaiMoi;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "nguoi_cap_nhat")
    private NguoiDung nguoiCapNhat;

    @Column(name = "ghi_chu", length = 500)
    private String ghiChu;

    @Column(name = "thoi_gian", nullable = false, updatable = false)
    private LocalDateTime thoiGian;

    @PrePersist
    protected void onCreate() {
        this.thoiGian = LocalDateTime.now();
    }
}