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
@Table(name = "diem_quy_tac")
public class DiemQuyTac {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ma_quy_tac")
    private Integer maQuyTac;

    @Column(name = "ti_le_tich", nullable = false)
    private Integer tiLeTich;

    @Column(name = "ti_le_doi", nullable = false)
    private Integer tiLeDoi;

    @Column(name = "thoi_han_thang", nullable = false)
    private Integer thoiHanThang;

    @Column(name = "diem_toi_thieu", nullable = false)
    private Integer diemToiThieu;

    @Column(name = "giam_toi_da_phan_tram", nullable = false)
    private Integer giamToiDaPhanTram;

    @Column(name = "tich_tien_mat", nullable = false)
    private Boolean tichTienMat;

    @Column(name = "ngay_cap_nhat")
    private LocalDateTime ngayCapNhat;

    @PreUpdate
    protected void onUpdate() {
        this.ngayCapNhat = LocalDateTime.now();
    }
}
