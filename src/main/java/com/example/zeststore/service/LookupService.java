package com.example.zeststore.service;

import com.example.zeststore.entity.KichCo;
import com.example.zeststore.entity.MauSac;
import com.example.zeststore.entity.ThuongHieu;
import com.example.zeststore.exception.BadRequestException;
import com.example.zeststore.exception.ResourceNotFoundException;
import com.example.zeststore.repository.BienTheSanPhamRepository;
import com.example.zeststore.repository.KichCoRepository;
import com.example.zeststore.repository.MauSacRepository;
import com.example.zeststore.repository.ThuongHieuRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class LookupService {

    private final ThuongHieuRepository thuongHieuRepository;
    private final KichCoRepository kichCoRepository;
    private final MauSacRepository mauSacRepository;
    private final BienTheSanPhamRepository bienTheRepository;

    public Object getBrands() {
        return thuongHieuRepository.findAll();
    }

    public ThuongHieu createBrand(String tenThuongHieu) {
        ThuongHieu brand = new ThuongHieu();
        brand.setTenThuongHieu(tenThuongHieu);
        return thuongHieuRepository.save(brand);
    }

    public ThuongHieu updateBrand(Integer id, String tenThuongHieu) {
        ThuongHieu brand = thuongHieuRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Brand", id));
        brand.setTenThuongHieu(tenThuongHieu);
        return thuongHieuRepository.save(brand);
    }

    public ThuongHieu toggleBrand(Integer id) {
        ThuongHieu brand = thuongHieuRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Brand", id));
        brand.setNgayXoa(brand.getNgayXoa() == null ? LocalDateTime.now() : null);
        return thuongHieuRepository.save(brand);
    }

    public Object getSizes() {
        return kichCoRepository.findAll();
    }

    public Object getColors() {
        return mauSacRepository.findAll();
    }

    public MauSac createColor(String tenMauSac, String maMauHex) {
        MauSac color = new MauSac();
        color.setMauSac(tenMauSac);
        color.setMaMauHex(maMauHex);
        return mauSacRepository.save(color);
    }

    public KichCo createSize(String tenKichCo) {
        KichCo size = new KichCo();
        size.setKichCo(tenKichCo);
        return kichCoRepository.save(size);
    }

    public void deleteColor(Integer id) {
        MauSac color = mauSacRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Color", id));
        if (bienTheRepository.existsByMauSac_MaMauSacAndNgayXoaIsNull(id)) {
            throw new BadRequestException("Cannot delete color because it is in use by existing variants");
        }
        mauSacRepository.delete(color);
    }

    public void deleteBrand(Integer id) {
        ThuongHieu brand = thuongHieuRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Brand", id));
        if (bienTheRepository.existsByThuongHieu_MaThuongHieuAndNgayXoaIsNull(id)) {
            throw new BadRequestException("Cannot delete brand because it is in use by existing variants");
        }
        brand.setNgayXoa(LocalDateTime.now());
        thuongHieuRepository.save(brand);
    }
}
