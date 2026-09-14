package com.example.zeststore.service;

import com.example.zeststore.entity.ThuocTinh;
import com.example.zeststore.exception.BadRequestException;
import com.example.zeststore.repository.ThuocTinhRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ThuocTinhService {

    private final ThuocTinhRepository thuocTinhRepository;

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
        thuocTinhRepository.deleteById(id);
    }
}
