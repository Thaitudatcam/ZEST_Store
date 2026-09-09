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
    private final InventoryService inventoryService;

    /**
     * Tổng số lượng đang được dự trữ (reserved) cho 1 biến thể trên toàn bộ các quầy POS.
     * Việc này KHÔNG làm thay đổi ton_kho vật lý - chỉ đếm trên bảng pos_cart_item.
     */
    private int totalReservedForVariant(Integer maBienThe) {
        return inventoryService.reserved(maBienThe, null, null);
    }

    @Transactional
    public PosCartItem addItem(Integer adminUserId, PosCartRequest request) {
        NguoiDung admin = nguoiDungRepository.findByIdForUpdate(adminUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User", adminUserId));
        BienTheSanPham variant = inventoryService.lockVariant(request.getMaBienThe());

        if (variant.getNgayXoa() != null) {
            throw new BadRequestException("Variant no longer exists");
        }

        // Tồn kho khả dụng cho quầy này = tồn vật lý - tổng số đang dự trữ của mọi quầy (kể cả quầy này).
        int physical = variant.getTonKho() != null ? variant.getTonKho() : 0;
        int reserved = totalReservedForVariant(request.getMaBienThe());
        int available = physical - reserved;

        if (request.getSoLuong() > available) {
            throw new BadRequestException("Insufficient stock for " + variant.getSku()
                    + " (available: " + available + ")");
        }

        PosCartItem existing = posCartRepository
                .findByAdmin_MaNguoiDungAndBienThe_MaBienThe(adminUserId, request.getMaBienThe())
                .orElse(null);

        if (existing != null) {
            boolean expired = existing.getNgayTao().isBefore(LocalDateTime.now().minusMinutes(30));
            existing.setSoLuong((expired ? 0 : existing.getSoLuong()) + request.getSoLuong());
            existing.setNgayTao(LocalDateTime.now());
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
        nguoiDungRepository.findByIdForUpdate(adminUserId);
        inventoryService.lockVariant(request.getMaBienThe());
        PosCartItem existing = posCartRepository
                .findByAdmin_MaNguoiDungAndBienThe_MaBienThe(adminUserId, request.getMaBienThe())
                .orElseThrow(() -> new BadRequestException("Item not found in cart"));

        if (existing.getSoLuong() < request.getSoLuong()) {
            throw new BadRequestException("Cannot release more than cart quantity");
        }

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
        return items.stream().filter(item -> item.getNgayTao().isAfter(LocalDateTime.now().minusMinutes(30))).map(item -> {
            BienTheSanPham v = item.getBienThe();
            int physical = v.getTonKho() != null ? v.getTonKho() : 0;
            // Dự trữ của CÁC QUẦY KHÁC (không kể quầy này) để hiển thị số còn khả dụng cho quầy hiện tại.
            int reservedOthers = totalReservedForVariant(v.getMaBienThe()) - item.getSoLuong();
            int tonKhoKhaDung = Math.max(0, physical - reservedOthers);
            Map<String, Object> m = new java.util.LinkedHashMap<>();
            m.put("id", item.getId());
            m.put("maBienThe", v.getMaBienThe());
            m.put("tenSanPham", v.getSanPham().getTenSanPham());
            m.put("kichCo", v.getKichCo().getKichCo());
            m.put("mauSac", v.getMauSac().getMauSac());
            m.put("gia", v.getGia());
            m.put("soLuong", item.getSoLuong());
            m.put("tonKho", physical);
            m.put("tonKhoKhaDung", tonKhoKhaDung);
            m.put("urlAnh", v.getUrlAnh() != null ? v.getUrlAnh() : v.getSanPham().getUrlAnhDaiDien());
            return m;
        }).collect(Collectors.toList());
    }

    @Transactional
    public void clearCart(Integer adminUserId) {
        nguoiDungRepository.findByIdForUpdate(adminUserId);
        posCartRepository.deleteByAdmin_MaNguoiDung(adminUserId);
    }

    @Transactional
    public void heartbeat(Integer adminUserId) {
        nguoiDungRepository.findByIdForUpdate(adminUserId);
        List<PosCartItem> active = posCartRepository.findByAdmin_MaNguoiDung(adminUserId);
        for (PosCartItem item : active) {
            // Never resurrect an expired hold: another sale may have taken it.
            if (item.getNgayTao().isAfter(LocalDateTime.now().minusMinutes(30)))
                item.setNgayTao(LocalDateTime.now());
        }
        posCartRepository.saveAll(active);
    }

}
