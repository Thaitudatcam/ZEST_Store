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

    private int available(BienTheSanPham variant) {
        return Math.max(0, variant.getTonKho() - inventoryService.reserved(variant.getMaBienThe(), null, null));
    }

    private void ensurePurchasable(BienTheSanPham variant) {
        SanPham product = variant == null ? null : variant.getSanPham();
        if (variant == null || variant.getNgayXoa() != null
                || !Integer.valueOf(1).equals(variant.getTrangThai())
                || product == null || product.getNgayXoa() != null
                || !Integer.valueOf(1).equals(product.getTrangThai())) {
            throw new BadRequestException("Sản phẩm đã ngừng bán hoặc không còn tồn tại");
        }
    }

    private final GioHangRepository gioHangRepository;
    private final MucGioHangRepository mucGioHangRepository;
    private final BienTheSanPhamRepository bienTheRepository;
    private final NguoiDungRepository nguoiDungRepository;
    private final CampaignDiscountService campaignDiscountService;
    private final InventoryService inventoryService;

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

        // % KM chương trình theo từng biến thể (batch 1 lần) — donGia trả về là giá đã trừ
        java.util.Set<Integer> variantIds = new java.util.HashSet<>();
        for (MucGioHang item : items) {
            if (item.getBienThe() != null) variantIds.add(item.getBienThe().getMaBienThe());
        }
        Map<Integer, BigDecimal> pctMap = campaignDiscountService.pctByVariantIds(variantIds);

        List<Map<String, Object>> result = new ArrayList<>();
        for (MucGioHang item : items) {
            BienTheSanPham variant = item.getBienThe();
            if (variant == null || variant.getNgayXoa() != null) {
                continue;
            }
            SanPham product = variant.getSanPham();
            if (product == null || product.getNgayXoa() != null || (product.getTrangThai() != null && product.getTrangThai() == 0)) {
                continue;
            }
            BigDecimal giaGoc = variant != null && variant.getGia() != null ? variant.getGia() : BigDecimal.ZERO;
            BigDecimal pct = variant != null ? pctMap.get(variant.getMaBienThe()) : null;
            BigDecimal donGia = CampaignDiscountService.discountedPrice(giaGoc, pct);
            Map<String, Object> itemMap = new LinkedHashMap<>();
            itemMap.put("maMucGioHang", item.getMaMucGioHang());
            itemMap.put("maBienThe", variant != null ? variant.getMaBienThe() : null);
            itemMap.put("maSanPham", product != null ? product.getMaSanPham() : null);
            itemMap.put("maSanPhamCode", product != null ? product.getMaSanPhamCode() : null);
            itemMap.put("sku", variant != null ? variant.getSku() : null);
            itemMap.put("tenSanPham", product != null ? product.getTenSanPham() : null);
            itemMap.put("slug", product != null ? product.getSlug() : null);
            itemMap.put("kichCo", variant != null && variant.getKichCo() != null ? variant.getKichCo().getKichCo() : null);
            itemMap.put("mauSac", variant != null && variant.getMauSac() != null ? variant.getMauSac().getMauSac() : null);
            itemMap.put("donGia", donGia);
            itemMap.put("giaGoc", giaGoc);
            itemMap.put("phanTramGiamGia", pct);
            itemMap.put("soLuong", item.getSoLuong());
            itemMap.put("tonKho", available(variant));
            itemMap.put("thanhTien", donGia.multiply(BigDecimal.valueOf(item.getSoLuong())));
            String urlAnh = variant != null ? variant.getUrlAnh() : null;
            if (urlAnh == null && product != null) {
                urlAnh = product.getUrlAnhDaiDien();
            }
            itemMap.put("urlAnh", urlAnh);
            itemMap.put("ngayXoa", variant != null ? variant.getNgayXoa() : null);
            itemMap.put("sanPhamTrangThai", product != null ? product.getTrangThai() : null);
            itemMap.put("sanPhamNgayXoa", product != null ? product.getNgayXoa() : null);
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

        ensurePurchasable(variant);
        Optional<MucGioHang> existing = mucGioHangRepository
                .findByGioHang_MaGioHangAndBienThe_MaBienThe(cart.getMaGioHang(), maBienThe);

        int stock = available(variant);
        int inCart = existing.map(MucGioHang::getSoLuong).orElse(0);
        if (stock <= 0) {
            throw new BadRequestException("Sản phẩm hiện đã hết hàng, không thể thêm vào giỏ.");
        }
        if ((long) inCart + soLuong > stock) {
            int remaining = Math.max(0, stock - inCart);
            throw new BadRequestException("Giỏ hàng đã có " + inCart + " sản phẩm này. Hiện chỉ có "
                    + stock + " sản phẩm khả dụng. " + (remaining == 0
                    ? "Bạn đã đạt số lượng tối đa, không thể thêm nữa."
                    : "Bạn chỉ có thể thêm tối đa " + remaining + " sản phẩm nữa."));
        }

        if (existing.isPresent()) {
            MucGioHang item = existing.get();
            int newQuantity = item.getSoLuong() + soLuong;
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
        ensurePurchasable(variant);
        if (soLuong > available(variant)) {
            throw new BadRequestException("Insufficient stock. Available: " + available(variant));
        }

        item.setSoLuong(soLuong);
        mucGioHangRepository.save(item);
        return Map.of("message", "Quantity updated");
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> validateCartStock(Integer userId) {
        GioHang cart = getOrCreateCart(userId);
        List<MucGioHang> items = mucGioHangRepository.findByGioHang_MaGioHang(cart.getMaGioHang());
        List<Map<String, Object>> issues = new ArrayList<>();
        for (MucGioHang item : items) {
            BienTheSanPham variant = item.getBienThe();
            if (variant == null || variant.getNgayXoa() != null) {
                Map<String, Object> m = new LinkedHashMap<>();
                m.put("maMucGioHang", item.getMaMucGioHang());
                m.put("maBienThe", variant != null ? variant.getMaBienThe() : null);
                m.put("type", "deleted");
                m.put("message", "Sản phẩm đã bị xoá");
                issues.add(m);
            } else if (available(variant) < item.getSoLuong()) {
                Map<String, Object> m = new LinkedHashMap<>();
                m.put("maBienThe", variant.getMaBienThe());
                m.put("type", "insufficient");
                m.put("currentQty", item.getSoLuong());
                m.put("availableStock", available(variant));
                m.put("message", "Chỉ còn " + available(variant) + " sản phẩm");
                issues.add(m);
            }
        }
        return issues;
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
