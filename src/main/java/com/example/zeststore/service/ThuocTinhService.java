package com.example.zeststore.service;

import com.example.zeststore.entity.ThuocTinh;
import com.example.zeststore.exception.BadRequestException;
import com.example.zeststore.exception.ResourceNotFoundException;
import com.example.zeststore.repository.SanPhamRepository;
import com.example.zeststore.repository.ThuocTinhRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ThuocTinhService {

    private final ThuocTinhRepository thuocTinhRepository;
    private final SanPhamRepository sanPhamRepository;

    public List<ThuocTinh> getByLoai(String loaiThuocTinh) {
        return thuocTinhRepository.findByLoaiThuocTinh(loaiThuocTinh);
    }

    public List<ThuocTinh> getAll() {
        return thuocTinhRepository.findAll();
    }

    @Transactional
    public ThuocTinh create(String loaiThuocTinh, String giaTri) {
        if (thuocTinhRepository.existsByLoaiThuocTinhAndGiaTri(loaiThuocTinh, giaTri)) {
            throw new BadRequestException("Đã tồn tại thuộc tính: " + giaTri);
        }
        ThuocTinh tt = ThuocTinh.builder()
                .loaiThuocTinh(loaiThuocTinh)
                .giaTri(giaTri)
                .build();
        return thuocTinhRepository.save(tt);
    }

    @Transactional
    public void delete(Integer id) {
        ThuocTinh attribute = thuocTinhRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thuộc tính"));
        long usageCount = countProductsUsing(attribute);
        if (usageCount > 0) {
            throw new BadRequestException("Không thể xóa “" + attribute.getGiaTri() + "” vì đang được sử dụng bởi "
                    + usageCount + " sản phẩm. Hãy cập nhật sản phẩm trước khi xóa.");
        }
        thuocTinhRepository.deleteById(id);
    }

    private long countProductsUsing(ThuocTinh attribute) {
        return switch (attribute.getLoaiThuocTinh()) {
            case "XUAT_XU" -> sanPhamRepository.countByXuatXuAndNgayXoaIsNull(attribute.getGiaTri());
            case "LOAI_AO" -> sanPhamRepository.countByLoaiAo_MaThuocTinhAndNgayXoaIsNull(attribute.getMaThuocTinh());
            case "KIEU_DANG" -> sanPhamRepository.countByKieuDang_MaThuocTinhAndNgayXoaIsNull(attribute.getMaThuocTinh());
            case "CHAT_LIEU" -> sanPhamRepository.countByChatLieu_MaThuocTinhAndNgayXoaIsNull(attribute.getMaThuocTinh());
            case "CO_AO" -> sanPhamRepository.countByCoAo_MaThuocTinhAndNgayXoaIsNull(attribute.getMaThuocTinh());
            case "TAY_AO" -> sanPhamRepository.countByTayAo_MaThuocTinhAndNgayXoaIsNull(attribute.getMaThuocTinh());
            case "VAI_AO" -> sanPhamRepository.countByVaiAo_MaThuocTinhAndNgayXoaIsNull(attribute.getMaThuocTinh());
            default -> 0L;
        };
    }
}
