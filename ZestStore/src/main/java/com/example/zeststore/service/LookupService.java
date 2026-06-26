package com.example.zeststore.service;

import com.example.zeststore.entity.KichCo;
import com.example.zeststore.entity.MauSac;
import com.example.zeststore.entity.ThuongHieu;
import com.example.zeststore.repository.KichCoRepository;
import com.example.zeststore.repository.MauSacRepository;
import com.example.zeststore.repository.ThuongHieuRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class LookupService {

    private final ThuongHieuRepository thuongHieuRepository;
    private final KichCoRepository kichCoRepository;
    private final MauSacRepository mauSacRepository;

    public Object getBrands() {
        return thuongHieuRepository.findAll();
    }

    public ThuongHieu createBrand(String tenThuongHieu) {
        ThuongHieu brand = new ThuongHieu();
        brand.setTenThuongHieu(tenThuongHieu);
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
}
