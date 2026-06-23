package com.example.zeststore.service;

import com.example.zeststore.dto.request.PosCartRequest;
import com.example.zeststore.entity.BienTheSanPham;
import com.example.zeststore.entity.NguoiDung;
import com.example.zeststore.entity.PosCartItem;
import com.example.zeststore.exception.BadRequestException;
import com.example.zeststore.exception.ResourceNotFoundException;
import com.example.zeststore.repository.BienTheSanPhamRepository;
import com.example.zeststore.repository.NguoiDungRepository;
import com.example.zeststore.repository.PosCartRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class PosCartService {

    private final PosCartRepository posCartRepository;
    private final BienTheSanPhamRepository bienTheRepository;
    private final NguoiDungRepository nguoiDungRepository;

    @Transactional
    public PosCartItem addItem(Integer adminUserId, PosCartRequest request) {
        NguoiDung admin = nguoiDungRepository.findById(adminUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User", adminUserId));
        BienTheSanPham variant = bienTheRepository.findById(request.getMaBienThe())
                .orElseThrow(() -> new ResourceNotFoundException("Variant", request.getMaBienThe()));

        if (variant.getTonKho() < request.getSoLuong()) {
            throw new BadRequestException("Insufficient stock for " + variant.getSku()
                    + " (available: " + variant.getTonKho() + ")");
        }

        variant.setTonKho(variant.getTonKho() - request.getSoLuong());
        bienTheRepository.save(variant);

        PosCartItem existing = posCartRepository
                .findByAdmin_MaNguoiDungAndBienThe_MaBienThe(adminUserId, request.getMaBienThe())
                .orElse(null);

        if (existing != null) {
            existing.setSoLuong(existing.getSoLuong() + request.getSoLuong());
            return posCartRepository.save(existing);
        }

        PosCartItem item = PosCartItem.builder()
                .admin(admin)
                .bienThe(variant)
                .soLuong(request.getSoLuong())
                .build();
        return posCartRepository.save(item);
    }

    @Transactional
    public void releaseItem(Integer adminUserId, PosCartRequest request) {
        PosCartItem existing = posCartRepository
                .findByAdmin_MaNguoiDungAndBienThe_MaBienThe(adminUserId, request.getMaBienThe())
                .orElseThrow(() -> new BadRequestException("Item not found in cart"));

        if (existing.getSoLuong() < request.getSoLuong()) {
            throw new BadRequestException("Cannot release more than cart quantity");
        }

        BienTheSanPham variant = existing.getBienThe();
        variant.setTonKho(variant.getTonKho() + request.getSoLuong());
        bienTheRepository.save(variant);

        int newQty = existing.getSoLuong() - request.getSoLuong();
        if (newQty <= 0) {
            posCartRepository.delete(existing);
        } else {
            existing.setSoLuong(newQty);
            posCartRepository.save(existing);
        }
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getCart(Integer adminUserId) {
        List<PosCartItem> items = posCartRepository.findByAdmin_MaNguoiDung(adminUserId);
        return items.stream().map(item -> {
            BienTheSanPham v = item.getBienThe();
            Map<String, Object> m = new java.util.LinkedHashMap<>();
            m.put("id", item.getId());
            m.put("maBienThe", v.getMaBienThe());
            m.put("tenSanPham", v.getSanPham().getTenSanPham());
            m.put("kichCo", v.getKichCo().getKichCo());
            m.put("mauSac", v.getMauSac().getMauSac());
            m.put("gia", v.getGia());
            m.put("soLuong", item.getSoLuong());
            m.put("tonKho", v.getTonKho());
            m.put("urlAnh", v.getUrlAnh() != null ? v.getUrlAnh() : v.getSanPham().getUrlAnhDaiDien());
            return m;
        }).collect(Collectors.toList());
    }

    @Transactional
    public void clearCart(Integer adminUserId) {
        List<PosCartItem> items = posCartRepository.findByAdmin_MaNguoiDung(adminUserId);
        for (PosCartItem item : items) {
            BienTheSanPham variant = item.getBienThe();
            variant.setTonKho(variant.getTonKho() + item.getSoLuong());
            bienTheRepository.save(variant);
        }
        posCartRepository.deleteByAdmin_MaNguoiDung(adminUserId);
    }

    @Scheduled(fixedRate = 60000)
    @Transactional
    public void releaseExpiredCarts() {
        LocalDateTime threshold = LocalDateTime.now().minusMinutes(30);
        List<PosCartItem> expired = posCartRepository.findByNgayTaoBefore(threshold);
        for (PosCartItem item : expired) {
            BienTheSanPham variant = item.getBienThe();
            variant.setTonKho(variant.getTonKho() + item.getSoLuong());
            bienTheRepository.save(variant);
            posCartRepository.delete(item);
            log.info("Released expired POS cart item #{} (variant {}, qty {})",
                    item.getId(), variant.getMaBienThe(), item.getSoLuong());
        }
    }
}
