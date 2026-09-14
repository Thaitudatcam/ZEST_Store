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
@Table(name = "muc_yeu_thich")
public class MucYeuThich {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ma_muc_yeu_thich")
    private Integer maMucYeuThich;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ma_ds_yeu_thich", nullable = false)
    private DanhSachYeuThich danhSachYeuThich;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ma_san_pham", nullable = false)
    private SanPham sanPham;

    @Column(name = "ngay_tao", nullable = false, updatable = false)
    private LocalDateTime ngayTao;

    @Column(name = "ngay_xoa")
    private LocalDateTime ngayXoa;

    @PrePersist
    protected void onCreate() {
        this.ngayTao = LocalDateTime.now();
    }
}
