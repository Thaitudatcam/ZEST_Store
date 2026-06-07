package com.example.zeststore.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "bao_cao_thong_ke")
public class BaoCaoThongKe {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ma_bao_cao")
    private Integer maBaoCao;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ma_nguoi_dung", nullable = false)
    private NguoiDung nguoiDung;

    @Column(name = "ten_bao_cao", nullable = false, length = 200)
    private String tenBaoCao;

    @Column(name = "loai_bao_cao", nullable = false, length = 50)
    private String loaiBaoCao;

    @Column(name = "du_lieu_bieu_do_json", columnDefinition = "NVARCHAR(MAX)")
    private String duLieuBieuDoJson;

    @Column(name = "tu_ngay", nullable = false)
    private LocalDate tuNgay;

    @Column(name = "den_ngay", nullable = false)
    private LocalDate denNgay;

    @Column(name = "duong_dan_file_excel", length = 500)
    private String duongDanFileExcel;

    @Column(name = "nguoi_nhan_email", length = 150)
    private String nguoiNhanEmail;

    @Column(name = "trang_thai_email", length = 20)
    private String trangThaiEmail;

    @Column(name = "ngay_tao", nullable = false, updatable = false)
    private LocalDateTime ngayTao;

    @Column(name = "ngay_xoa")
    private LocalDateTime ngayXoa;

    @PrePersist
    protected void onCreate() {
        this.ngayTao = LocalDateTime.now();
    }
}
