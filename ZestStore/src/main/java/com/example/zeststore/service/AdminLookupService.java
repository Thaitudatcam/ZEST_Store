package com.example.zeststore.service;

import com.example.zeststore.entity.KichCo;
import com.example.zeststore.entity.MauSac;
import com.example.zeststore.entity.ThuongHieu;
import com.example.zeststore.exception.DuplicateResourceException;
import com.example.zeststore.exception.ResourceNotFoundException;
import com.example.zeststore.repository.KichCoRepository;
import com.example.zeststore.repository.MauSacRepository;
import com.example.zeststore.repository.ThuongHieuRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;

@Service
@RequiredArgsConstructor
public class AdminLookupService {

    private final ThuongHieuRepository thuongHieuRepository;
    private final KichCoRepository kichCoRepository;
    private final MauSacRepository mauSacRepository;

    @Transactional
    public ThuongHieu createBrand(Map<String, String> body) {
        String ten = body.get("tenThuongHieu");
        if (ten == null || ten.isBlank())
            throw new IllegalArgumentException("Brand name is required");
        ThuongHieu brand = ThuongHieu.builder().tenThuongHieu(ten).trangThai(1).build();
        if (body.containsKey("moTa")) brand.setMoTa(body.get("moTa"));
        if (body.containsKey("website")) brand.setWebsite(body.get("website"));
        if (body.containsKey("logoUrl")) brand.setLogoUrl(body.get("logoUrl"));
        return thuongHieuRepository.save(brand);
    }

    @Transactional
    public ThuongHieu updateBrand(Integer id, Map<String, String> body) {
        ThuongHieu brand = thuongHieuRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Brand", id));
        if (body.containsKey("tenThuongHieu") && !body.get("tenThuongHieu").isBlank())
            brand.setTenThuongHieu(body.get("tenThuongHieu"));
        if (body.containsKey("moTa")) brand.setMoTa(body.get("moTa"));
        if (body.containsKey("website")) brand.setWebsite(body.get("website"));
        if (body.containsKey("logoUrl")) brand.setLogoUrl(body.get("logoUrl"));
        if (body.containsKey("trangThai")) brand.setTrangThai(Integer.valueOf(body.get("trangThai")));
        return thuongHieuRepository.save(brand);
    }

    public Map<String, String> deleteBrand(Integer id) {
        thuongHieuRepository.deleteById(id);
        return Map.of("message", "Brand deleted");
    }

    @Transactional
    public KichCo createSize(Map<String, String> body) {
        String kichCo = body.get("kichCo");
        if (kichCo == null || kichCo.isBlank())
            throw new IllegalArgumentException("Size is required");
        KichCo size = KichCo.builder().kichCo(kichCo).build();
        if (body.containsKey("thuTu")) size.setThuTu(Integer.valueOf(body.get("thuTu")));
        if (body.containsKey("loai")) size.setLoai(body.get("loai"));
        return kichCoRepository.save(size);
    }

    @Transactional
    public KichCo updateSize(Integer id, Map<String, String> body) {
        KichCo size = kichCoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Size", id));
        if (body.containsKey("kichCo") && !body.get("kichCo").isBlank()) size.setKichCo(body.get("kichCo"));
        if (body.containsKey("thuTu")) size.setThuTu(Integer.valueOf(body.get("thuTu")));
        if (body.containsKey("loai")) size.setLoai(body.get("loai"));
        return kichCoRepository.save(size);
    }

    public Map<String, String> deleteSize(Integer id) {
        kichCoRepository.deleteById(id);
        return Map.of("message", "Size deleted");
    }

    @Transactional
    public MauSac createColor(Map<String, String> body) {
        String mauSac = body.get("mauSac");
        if (mauSac == null || mauSac.isBlank())
            throw new IllegalArgumentException("Color name is required");
        MauSac color = MauSac.builder().mauSac(mauSac).maMauHex(body.get("maMauHex")).build();
        if (body.containsKey("nhomMau")) color.setNhomMau(body.get("nhomMau"));
        return mauSacRepository.save(color);
    }

    @Transactional
    public MauSac updateColor(Integer id, Map<String, String> body) {
        MauSac color = mauSacRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Color", id));
        if (body.containsKey("mauSac") && !body.get("mauSac").isBlank()) color.setMauSac(body.get("mauSac"));
        if (body.containsKey("maMauHex")) color.setMaMauHex(body.get("maMauHex"));
        if (body.containsKey("nhomMau")) color.setNhomMau(body.get("nhomMau"));
        return mauSacRepository.save(color);
    }

    public Map<String, String> deleteColor(Integer id) {
        mauSacRepository.deleteById(id);
        return Map.of("message", "Color deleted");
    }
}
