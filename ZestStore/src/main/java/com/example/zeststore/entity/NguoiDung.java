package com.example.zeststore.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import com.fasterxml.jackson.annotation.JsonIgnore;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "nguoi_dung")
public class NguoiDung {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ma_nguoi_dung")
    private Integer maNguoiDung;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ma_vai_tro", nullable = false)
    private VaiTro vaiTro;

    @Column(name = "ho_ten", nullable = false, length = 100)
    private String hoTen;

    @Column(name = "email", nullable = false, length = 150, unique = true)
    private String email;

    @Column(name = "mat_khau_ma_hoa", nullable = false, length = 255)
    private String matKhauMaHoa;

    @Column(name = "so_dien_thoai", length = 15, unique = true)
    private String soDienThoai;

    @Column(name = "trang_thai", nullable = false, length = 20)
    @Builder.Default
    private String trangThai = "active";

    @Column(name = "anh_dai_dien", length = 500)
    private String anhDaiDien;

    @Column(name = "gioi_tinh", length = 10)
    private String gioiTinh;

    @Column(name = "ngay_sinh")
    private LocalDate ngaySinh;

    @Column(name = "ngay_tao", nullable = false, updatable = false)
    private LocalDateTime ngayTao;

    @Column(name = "ngay_cap_nhat")
    private LocalDateTime ngayCapNhat;

    @Column(name = "ngay_xoa")
    private LocalDateTime ngayXoa;

    @OneToMany(mappedBy = "nguoiDung", cascade = CascadeType.ALL, orphanRemoval = true)
    @ToString.Exclude
    @JsonIgnore
    private List<DiaChiNguoiDung> diaChis;

    @OneToOne(mappedBy = "nguoiDung", cascade = CascadeType.ALL)
    @ToString.Exclude
    @JsonIgnore
    private GioHang gioHang;

    @OneToMany(mappedBy = "nguoiDung")
    @ToString.Exclude
    @JsonIgnore
    private List<DonHang> donHangs;

    @OneToMany(mappedBy = "nguoiDung")
    @ToString.Exclude
    @JsonIgnore
    private List<DanhGia> danhGias;

    @OneToOne(mappedBy = "nguoiDung", cascade = CascadeType.ALL)
    @ToString.Exclude
    @JsonIgnore
    private DanhSachYeuThich danhSachYeuThich;

    @OneToMany(mappedBy = "nguoiDung")
    @ToString.Exclude
    @JsonIgnore
    private List<BaoCaoThongKe> baoCaos;

    @OneToMany(mappedBy = "nguoiDung")
    @ToString.Exclude
    @JsonIgnore
    private List<HoiThoaiChatbot> hoiThoais;

    @OneToMany(mappedBy = "nguoiDung")
    @ToString.Exclude
    @JsonIgnore
    private List<HanhViNguoiDung> hanhVis;

    @PrePersist
    protected void onCreate() {
        this.ngayTao = LocalDateTime.now();
        if (this.trangThai == null) this.trangThai = "active";
    }

    @PreUpdate
    protected void onUpdate() {
        this.ngayCapNhat = LocalDateTime.now();
    }
}
