package com.example.zeststore.service;

import com.example.zeststore.entity.BienTheSanPham;
import com.example.zeststore.entity.ChuongTrinhQuaTang;
import com.example.zeststore.entity.SanPham;
import com.example.zeststore.repository.BienTheSanPhamRepository;
import com.example.zeststore.repository.ChuongTrinhQuaTangRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Tính % giảm giá từ các chương trình đang chạy để hiển thị ra shop
 * (badge -% trên ProductCard / trang chi tiết). Không chạm tới giá gốc
 * trong giỏ hàng, POS hay đơn hàng.
 */
@Service
@RequiredArgsConstructor
public class CampaignDiscountService {

    private final ChuongTrinhQuaTangRepository campaignRepository;
    private final BienTheSanPhamRepository bienTheRepository;

    /** Rule gọn nhẹ đã copy ID scope (empty set = áp dụng tất cả). */
    public record DiscountRule(
            Integer kieuGiamGia,
            BigDecimal giaTriGiam,
            Set<Integer> sanPhamIds,
            Set<Integer> bienTheIds) {}

    private record VariantRef(Integer maSanPham, BigDecimal gia) {}

    private List<DiscountRule> activeRulesInternal() {
        List<ChuongTrinhQuaTang> campaigns =
                campaignRepository.findActiveDiscounts(LocalDateTime.now());
        return campaigns.stream()
                .filter(c -> c.getGiaTriGiam() != null
                        && c.getGiaTriGiam().compareTo(BigDecimal.ZERO) > 0)
                .map(c -> new DiscountRule(
                        c.getKieuGiamGia() != null ? c.getKieuGiamGia() : 1,
                        c.getGiaTriGiam(),
                        c.getSanPhamApDung() != null
                                ? c.getSanPhamApDung().stream()
                                        .map(SanPham::getMaSanPham)
                                        .collect(Collectors.toSet())
                                : new HashSet<>(),
                        c.getBienTheApDung() != null
                                ? c.getBienTheApDung().stream()
                                        .map(BienTheSanPham::getMaBienThe)
                                        .collect(Collectors.toSet())
                                : new HashSet<>()))
                .toList();
    }

    /** Quy đổi rule ra % trên một mức giá (làm tròn 1 chữ số thập phân, chặn 100). */
    private static BigDecimal pctOf(DiscountRule r, BigDecimal gia) {
        if (r.kieuGiamGia() != null && r.kieuGiamGia() == 2) {
            if (gia == null || gia.compareTo(BigDecimal.ZERO) <= 0) return BigDecimal.ZERO;
            return r.giaTriGiam().multiply(BigDecimal.valueOf(100))
                    .divide(gia, 1, RoundingMode.HALF_UP)
                    .min(BigDecimal.valueOf(100));
        }
        return r.giaTriGiam().min(BigDecimal.valueOf(100));
    }

    private Map<Integer, VariantRef> loadVariantRefs(Set<Integer> ids) {
        if (ids.isEmpty()) return Map.of();
        Map<Integer, VariantRef> map = new HashMap<>();
        for (BienTheSanPham v : bienTheRepository.findAllById(ids)) {
            map.put(v.getMaBienThe(), new VariantRef(
                    v.getSanPham() != null ? v.getSanPham().getMaSanPham() : null,
                    v.getGia()));
        }
        return map;
    }

    /**
     * % giảm theo từng sản phẩm (lấy max khi nhiều đợt trùng).
     * @param minPriceByProduct giá thấp nhất từng SP (đã có sẵn ở populateStock)
     */
    @Transactional(readOnly = true)
    public Map<Integer, BigDecimal> pctByProductIds(Map<Integer, BigDecimal> minPriceByProduct) {
        List<DiscountRule> rules = activeRulesInternal();
        if (rules.isEmpty() || minPriceByProduct.isEmpty()) return Map.of();
        Set<Integer> scopedVariantIds = rules.stream()
                .flatMap(r -> r.bienTheIds().stream())
                .collect(Collectors.toSet());
        Map<Integer, VariantRef> scopedVariants = loadVariantRefs(scopedVariantIds);

        Map<Integer, BigDecimal> out = new HashMap<>();
        for (Map.Entry<Integer, BigDecimal> e : minPriceByProduct.entrySet()) {
            Integer maSP = e.getKey();
            BigDecimal best = BigDecimal.ZERO;
            for (DiscountRule r : rules) {
                if (!r.bienTheIds().isEmpty()) {
                    for (Integer vid : r.bienTheIds()) {
                        VariantRef ref = scopedVariants.get(vid);
                        if (ref != null && maSP.equals(ref.maSanPham())) {
                            best = best.max(pctOf(r, ref.gia()));
                        }
                    }
                } else if (r.sanPhamIds().isEmpty() || r.sanPhamIds().contains(maSP)) {
                    best = best.max(pctOf(r, e.getValue()));
                }
            }
            if (best.compareTo(BigDecimal.ZERO) > 0) out.put(maSP, best);
        }
        return out;
    }

    /**
     * % giảm theo từng biến thể (dùng cho giỏ hàng / đặt hàng — tiền thật).
     * Batch 1 lần cho cả giỏ để tránh N+1.
     */
    @Transactional(readOnly = true)
    public Map<Integer, BigDecimal> pctByVariantIds(java.util.Collection<Integer> variantIds) {
        if (variantIds == null || variantIds.isEmpty()) return Map.of();
        List<DiscountRule> rules = activeRulesInternal();
        if (rules.isEmpty()) return Map.of();
        Map<Integer, BigDecimal> out = new HashMap<>();
        for (BienTheSanPham v : bienTheRepository.findAllById(new HashSet<>(variantIds))) {
            Integer maSP = v.getSanPham() != null ? v.getSanPham().getMaSanPham() : null;
            BigDecimal best = BigDecimal.ZERO;
            for (DiscountRule r : rules) {
                if (!r.bienTheIds().isEmpty()) {
                    if (r.bienTheIds().contains(v.getMaBienThe())) {
                        best = best.max(pctOf(r, v.getGia()));
                    }
                } else if (r.sanPhamIds().isEmpty()
                        || (maSP != null && r.sanPhamIds().contains(maSP))) {
                    best = best.max(pctOf(r, v.getGia()));
                }
            }
            if (best.compareTo(BigDecimal.ZERO) > 0) out.put(v.getMaBienThe(), best);
        }
        return out;
    }

    /** Giá sau khi trừ % KM (làm tròn đồng, chặn 0). Dùng chung cho giỏ/đơn để khỏi lệch. */
    public static BigDecimal discountedPrice(BigDecimal gia, BigDecimal pct) {
        if (gia == null) return BigDecimal.ZERO;
        if (pct == null || pct.compareTo(BigDecimal.ZERO) <= 0) return gia;
        BigDecimal factor = BigDecimal.ONE.subtract(
                pct.min(BigDecimal.valueOf(100))
                        .divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP));
        return gia.multiply(factor).setScale(0, RoundingMode.HALF_UP).max(BigDecimal.ZERO);
    }

    /** Gán % giảm lên từng biến thể đã load sẵn (trang chi tiết, danh sách biến thể). */
    @Transactional(readOnly = true)
    public void applyToVariants(List<BienTheSanPham> variants) {
        if (variants == null || variants.isEmpty()) return;
        List<DiscountRule> rules = activeRulesInternal();
        if (rules.isEmpty()) return;
        for (BienTheSanPham v : variants) {
            Integer maSP = v.getSanPham() != null ? v.getSanPham().getMaSanPham() : null;
            BigDecimal best = BigDecimal.ZERO;
            for (DiscountRule r : rules) {
                if (!r.bienTheIds().isEmpty()) {
                    if (r.bienTheIds().contains(v.getMaBienThe())) {
                        best = best.max(pctOf(r, v.getGia()));
                    }
                } else if (r.sanPhamIds().isEmpty()
                        || (maSP != null && r.sanPhamIds().contains(maSP))) {
                    best = best.max(pctOf(r, v.getGia()));
                }
            }
            if (best.compareTo(BigDecimal.ZERO) > 0) v.setPhanTramGiamGia(best);
        }
    }
}
