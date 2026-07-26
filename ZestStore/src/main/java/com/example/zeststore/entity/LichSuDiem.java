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
@Table(name = "lich_su_diem")
public class LichSuDiem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ma_lich_su")
    private Integer maLichSu;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ma_nguoi_dung", nullable = false)
    @ToString.Exclude
    private NguoiDung nguoiDung;

    @Column(name = "loai_giao_dich", nullable = false, length = 20)
    private String loaiGiaoDich;

    @Column(name = "so_diem", nullable = false)
    private Integer soDiem;

    @Column(name = "so_diem_con_lai")
    private Integer soDiemConLai;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ma_lich_su_goc")
    @ToString.Exclude
    private LichSuDiem lichSuGoc;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ma_don_hang")
    @ToString.Exclude
    private DonHang donHang;

    @Column(name = "ma_kenh", length = 10)
    private String maKenh;

    @Column(name = "ngay_tich")
    private LocalDateTime ngayTich;

    @Column(name = "ngay_het_han")
    private LocalDateTime ngayHetHan;

    @Column(name = "thoi_gian", nullable = false)
    @Builder.Default
    private LocalDateTime thoiGian = LocalDateTime.now();

    @PrePersist
    protected void onCreate() {
        if (this.thoiGian == null) this.thoiGian = LocalDateTime.now();
    }
}
