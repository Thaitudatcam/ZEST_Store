package com.example.zeststore.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "thuoc_tinh")
public class ThuocTinh {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ma_thuoc_tinh")
    private Integer maThuocTinh;

    @NotBlank
    @Size(max = 50)
    @Column(name = "loai_thuoc_tinh", nullable = false, length = 50)
    private String loaiThuocTinh;

    @NotBlank
    @Size(max = 200)
    @Column(name = "gia_tri", nullable = false, length = 200)
    private String giaTri;

    @Column(name = "ngay_tao", nullable = false, updatable = false)
    private LocalDateTime ngayTao;

    @PrePersist
    protected void onCreate() {
        this.ngayTao = LocalDateTime.now();
    }
}
