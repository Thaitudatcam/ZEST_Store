package com.example.zeststore.service;

import com.example.zeststore.entity.*;
import com.example.zeststore.exception.BadRequestException;
import com.example.zeststore.exception.ResourceNotFoundException;
import com.example.zeststore.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.*;

@Service
@RequiredArgsConstructor
public class GioHangService {

    private final GioHangRepository gioHangRepository;
    private final MucGioHangRepository mucGioHangRepository;
    private final BienTheSanPhamRepository bienTheRepository;
    private final NguoiDungRepository nguoiDungRepository;

    @Transactional(readOnly = true)
    public GioHang getOrCreateCart(Integer userId) {
        return gioHangRepository.findByNguoiDung_MaNguoiDung(userId)
                .orElseGet(() -> {
                    NguoiDung user = nguoiDungRepository.findById(userId)
                            .orElseThrow(() -> new ResourceNotFoundException("User", userId));
                    return gioHangRepository.save(GioHang.builder().nguoiDung(user).build());
                });
    }

    public List<Map<String, Object>> getCartItems(Integer userId) {
        GioHang cart = getOrCreateCart(userId);
        List<MucGioHang> items = mucGioHangRepository.findByGioHang_MaGioHang(cart.getMaGioHang());

        List<Map<String, Object>> result = new ArrayList<>();
        for (MucGioHang item : items) {
            BienTheSanPham variant = item.getBienThe();
            SanPham product = variant != null ? variant.getSanPham() : null;
            Map<String, Object> itemMap = new LinkedHashMap<>();
            itemMap.put("maMucGioHang", item.getMaMucGioHang());
            itemMap.put("maBienThe", variant != null ? variant.getMaBienThe() : null);
            itemMap.put("maSanPham", product != null ? product.getMaSanPham() : null);
            itemMap.put("tenSanPham", product != null ? product.getTenSanPham() : null);
            itemMap.put("slug", product != null ? product.getSlug() : null);
            itemMap.put("kichCo", variant != null && variant.getKichCo() != null ? variant.getKichCo().getKichCo() : null);
            itemMap.put("mauSac", variant != null && variant.getMauSac() != null ? variant.getMauSac().getMauSac() : null);
            itemMap.put("donGia", variant != null ? variant.getGia() : BigDecimal.ZERO);
            itemMap.put("soLuong", item.getSoLuong());
            itemMap.put("thanhTien", variant != null ? variant.getGia().multiply(BigDecimal.valueOf(item.getSoLuong())) : BigDecimal.ZERO);
            itemMap.put("urlAnh", variant != null ? variant.getUrlAnh() : null);
            result.add(itemMap);
        }
        return result;
    }

    @Transactional
    public Map<String, Object> addItem(Integer userId, Integer maBienThe, Integer soLuong) {
        if (soLuong == null || soLuong < 1) {
            throw new BadRequestException("Số lượng phải lớn hơn 0");
        }
        GioHang cart = getOrCreateCart(userId);
        BienTheSanPham variant = bienTheRepository.findById(maBienThe)
                .orElseThrow(() -> new ResourceNotFoundException("Variant", maBienThe));

        if (variant.getTonKho() < soLuong) {
            throw new BadRequestException("Insufficient stock. Available: " + variant.getTonKho());
        }

        Optional<MucGioHang> existing = mucGioHangRepository
                .findByGioHang_MaGioHangAndBienThe_MaBienThe(cart.getMaGioHang(), maBienThe);

        if (existing.isPresent()) {
            MucGioHang item = existing.get();
            int newQuantity = item.getSoLuong() + soLuong;
            if (newQuantity > variant.getTonKho()) {
                throw new BadRequestException("Insufficient stock. Available: " + variant.getTonKho());
            }
            item.setSoLuong(newQuantity);
            mucGioHangRepository.save(item);
        } else {
            mucGioHangRepository.save(MucGioHang.builder()
                    .gioHang(cart)
                    .bienThe(variant)
                    .soLuong(soLuong)
                    .build());
        }

        return Map.of("message", "Item added to cart");
    }

    @Transactional
    public Map<String, Object> updateQuantity(Integer userId, Integer maBienThe, Integer soLuong) {
        if (soLuong == null || soLuong < 1) {
            throw new BadRequestException("Số lượng phải lớn hơn 0");
        }
        GioHang cart = getOrCreateCart(userId);
        MucGioHang item = mucGioHangRepository
                .findByGioHang_MaGioHangAndBienThe_MaBienThe(cart.getMaGioHang(), maBienThe)
                .orElseThrow(() -> new ResourceNotFoundException("Cart item not found"));

        BienTheSanPham variant = item.getBienThe();
        if (soLuong > variant.getTonKho()) {
            throw new BadRequestException("Insufficient stock. Available: " + variant.getTonKho());
        }

        item.setSoLuong(soLuong);
        mucGioHangRepository.save(item);
        return Map.of("message", "Quantity updated");
    }

    @Transactional
    public Map<String, String> removeItem(Integer userId, Integer maBienThe) {
        GioHang cart = getOrCreateCart(userId);
        MucGioHang item = mucGioHangRepository
                .findByGioHang_MaGioHangAndBienThe_MaBienThe(cart.getMaGioHang(), maBienThe)
                .orElseThrow(() -> new ResourceNotFoundException("Cart item not found"));
        mucGioHangRepository.delete(item);
        return Map.of("message", "Item removed from cart");
    }

    @Transactional
    public Map<String, String> clearCart(Integer userId) {
        GioHang cart = getOrCreateCart(userId);
        List<MucGioHang> items = mucGioHangRepository.findByGioHang_MaGioHang(cart.getMaGioHang());
        mucGioHangRepository.deleteAll(items);
        return Map.of("message", "Cart cleared");
    }
}