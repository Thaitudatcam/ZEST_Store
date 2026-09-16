package com.example.zeststore.service;

import com.example.zeststore.dto.request.PosDraftRequest;
import com.example.zeststore.entity.*;
import com.example.zeststore.exception.BadRequestException;
import com.example.zeststore.exception.ResourceNotFoundException;
import com.example.zeststore.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
public class PosCartService {
    private final PosCartRepository posCartRepository;
    private final NguoiDungRepository nguoiDungRepository;
    private final DonHangRepository donHangRepository;
    private final InventoryService inventoryService;

    private String key(String value) {
        if (value == null || value.isBlank() || value.trim().length() > 64)
            throw new BadRequestException("Thiếu mã hóa đơn đang giữ hàng");
        return value.trim();
    }

    /** Absolute quantities make network retries safe (never add twice). */
    @Transactional
    public Map<String, Object> replace(Integer adminId, PosDraftRequest request) {
        String draft = key(request.getCheckoutKey());
        NguoiDung admin = nguoiDungRepository.findByIdForUpdate(adminId)
                .orElseThrow(() -> new ResourceNotFoundException("User", adminId));
        if (donHangRepository.findByCheckoutKey("POS:" + adminId + ":" + draft).isPresent())
            throw new BadRequestException("Hóa đơn đã thanh toán. Vui lòng mở hóa đơn mới");
        if (request.getItems() == null || request.getItems().size() > 200)
            throw new BadRequestException("Danh sách sản phẩm không hợp lệ");
        SortedMap<Integer, Integer> desired = new TreeMap<>();
        request.getItems().forEach(i -> {
            if (i == null || i.getMaBienThe() == null || i.getSoLuong() == null || i.getSoLuong() <= 0)
                throw new BadRequestException("Số lượng phải lớn hơn 0");
            desired.merge(i.getMaBienThe(), i.getSoLuong(), Math::addExact);
        });
        LocalDateTime now = LocalDateTime.now();
        long otherDrafts = posCartRepository.findByAdmin_MaNguoiDung(adminId).stream()
                .filter(i -> i.getNgayTao().isAfter(now.minusMinutes(30)))
                .map(PosCartItem::getDraftKey).filter(Objects::nonNull)
                .filter(k -> !draft.equals(k)).distinct().count();
        if (!desired.isEmpty() && otherDrafts >= 10)
            throw new BadRequestException("Chỉ được giữ hàng cho tối đa 10 hóa đơn cùng lúc");

        List<PosCartItem> existing = posCartRepository.findByAdmin_MaNguoiDungAndDraftKey(adminId, draft);
        SortedSet<Integer> ids = new TreeSet<>(desired.keySet());
        existing.forEach(i -> ids.add(i.getBienThe().getMaBienThe()));
        Map<Integer, BienTheSanPham> locked = new HashMap<>();
        ids.forEach(id -> locked.put(id, inventoryService.lockVariant(id)));
        desired.forEach((id, qty) -> {
            BienTheSanPham v = locked.get(id);
            if (v.getNgayXoa() != null || !Integer.valueOf(1).equals(v.getTrangThai())
                    || v.getSanPham().getNgayXoa() != null || !Integer.valueOf(1).equals(v.getSanPham().getTrangThai()))
                throw new BadRequestException("Sản phẩm đã ngừng bán: " + v.getSku());
            int available = Math.max(0, v.getTonKho() - inventoryService.reserved(id, null, adminId, draft));
            if (qty > available)
                throw new BadRequestException("Chỉ còn " + available + " sản phẩm khả dụng cho " + v.getSku());
        });
        Map<Integer, PosCartItem> byVariant = new HashMap<>();
        existing.forEach(i -> byVariant.put(i.getBienThe().getMaBienThe(), i));
        existing.stream().filter(i -> !desired.containsKey(i.getBienThe().getMaBienThe())).forEach(posCartRepository::delete);
        desired.forEach((id, qty) -> {
            PosCartItem item = byVariant.getOrDefault(id, PosCartItem.builder()
                    .admin(admin).draftKey(draft).bienThe(locked.get(id)).build());
            item.setSoLuong(qty);
            item.setNgayTao(now);
            posCartRepository.save(item);
        });
        posCartRepository.flush();
        return getCart(adminId, draft);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getCart(Integer adminId, String checkoutKey) {
        String draft = key(checkoutKey);
        var active = posCartRepository.findByAdmin_MaNguoiDungAndDraftKey(adminId, draft).stream()
                .filter(i -> i.getNgayTao().isAfter(LocalDateTime.now().minusMinutes(30))).toList();
        List<Map<String, Object>> items = active.stream().map(i -> {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("maBienThe", i.getBienThe().getMaBienThe());
            row.put("soLuong", i.getSoLuong());
            row.put("expiresAt", i.getNgayTao().plusMinutes(30));
            return row;
        }).toList();
        return Map.of("checkoutKey", draft, "items", items);
    }

    @Transactional
    public void clearCart(Integer adminId, String checkoutKey) {
        String draft = key(checkoutKey);
        nguoiDungRepository.findByIdForUpdate(adminId);
        var items = posCartRepository.findByAdmin_MaNguoiDungAndDraftKey(adminId, draft);
        items.stream().map(i -> i.getBienThe().getMaBienThe()).distinct().sorted().forEach(inventoryService::lockVariant);
        posCartRepository.deleteAll(items);
    }

    @Transactional
    public void heartbeat(Integer adminId, String checkoutKey) {
        String draft = key(checkoutKey);
        nguoiDungRepository.findByIdForUpdate(adminId);
        var items = posCartRepository.findByAdmin_MaNguoiDungAndDraftKey(adminId, draft);
        items.stream().map(i -> i.getBienThe().getMaBienThe()).distinct().sorted().forEach(inventoryService::lockVariant);
        LocalDateTime now = LocalDateTime.now();
        if (items.isEmpty() || items.stream().anyMatch(i -> !i.getNgayTao().isAfter(now.minusMinutes(30))))
            throw new BadRequestException("Giữ hàng đã hết hạn. Vui lòng kiểm tra và giữ lại hàng");
        items.forEach(i -> i.setNgayTao(now));
        posCartRepository.saveAll(items);
    }

    @Transactional
    public Map<Integer, Integer> availability(List<Integer> ids) {
        if (ids.size() > 300) throw new BadRequestException("Tối đa 300 biến thể mỗi lần kiểm tra");
        Map<Integer, Integer> result = new LinkedHashMap<>();
        // Use the same locked read for a consistent physical/reserved stock pair.
        ids.stream().distinct().sorted().forEach(id -> {
            BienTheSanPham v = inventoryService.lockVariant(id);
            result.put(id, Math.max(0, v.getTonKho() - inventoryService.reserved(id, null, null)));
        });
        return result;
    }
}
