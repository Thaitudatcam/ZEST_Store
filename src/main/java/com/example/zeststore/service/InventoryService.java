package com.example.zeststore.service;

import com.example.zeststore.entity.*;
import com.example.zeststore.exception.BadRequestException;
import com.example.zeststore.repository.*;
import jakarta.persistence.EntityManager;
import jakarta.persistence.LockModeType;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.*;

/** All callers hold the order lock before acquiring variant locks in ascending ID order. */
@Service
@RequiredArgsConstructor
@Transactional
public class InventoryService {
    private final BienTheSanPhamRepository variants;
    private final MucDonHangRepository items;
    private final DonHangRepository orders;
    private final PosCartRepository carts;
    private final EntityManager em;

    public BienTheSanPham lockVariant(Integer id) {
        BienTheSanPham v = variants.findByIdForUpdate(id)
                .orElseThrow(() -> new BadRequestException("Không tìm thấy biến thể " + id));
        // A cart may already have loaded this entity before the lock was acquired.
        em.refresh(v, LockModeType.PESSIMISTIC_WRITE);
        return v;
    }

    public int reserved(Integer variantId, Integer excludingOrder, Integer excludingAdmin) {
        Long online = em.createQuery("SELECT COALESCE(SUM(m.soLuong),0) FROM MucDonHang m "
                + "WHERE m.bienThe.maBienThe = :v AND m.donHang.stockState = 'RESERVED' "
                + "AND (:o IS NULL OR m.donHang.maDonHang <> :o)", Long.class)
                .setParameter("v", variantId).setParameter("o", excludingOrder).getSingleResult();
        int pos = carts.findByBienThe_MaBienThe(variantId).stream()
                .filter(c -> c.getNgayTao().isAfter(LocalDateTime.now().minusMinutes(30)))
                .filter(c -> excludingAdmin == null || !excludingAdmin.equals(c.getAdmin().getMaNguoiDung()))
                .mapToInt(PosCartItem::getSoLuong).sum();
        return Math.toIntExact(online) + pos;
    }

    private SortedMap<Integer, Integer> quantities(DonHang order) {
        SortedMap<Integer, Integer> result = new TreeMap<>();
        for (MucDonHang item : items.findByDonHang_MaDonHang(order.getMaDonHang())) {
            if (item.getSoLuong() == null || item.getSoLuong() <= 0)
                throw new BadRequestException("Số lượng phải lớn hơn 0");
            result.merge(item.getBienThe().getMaBienThe(), item.getSoLuong(), Math::addExact);
        }
        if (result.isEmpty()) throw new BadRequestException("Đơn hàng không có sản phẩm");
        return result;
    }

    public void reserve(DonHang order) { change(order, false, null); }
    public void deduct(DonHang order) { change(order, true, null); }
    public void deductPos(DonHang order, Integer adminId) { change(order, true, adminId); }

    private void change(DonHang order, boolean deduct, Integer adminId) {
        String state = order.getStockState();
        if ("DEDUCTED".equals(state) || (!deduct && "RESERVED".equals(state))) return;
        if (!"NONE".equals(state) && !"RESERVED".equals(state))
            throw new BadRequestException("Đơn đã giải phóng hàng hoặc cần đối soát tồn kho cũ");
        SortedMap<Integer, Integer> quantities = quantities(order);
        Map<Integer, BienTheSanPham> locked = new LinkedHashMap<>();
        quantities.forEach((id, qty) -> {
            BienTheSanPham v = lockVariant(id);
            if ((!"RESERVED".equals(state) && v.getNgayXoa() != null)
                    || v.getTonKho() - reserved(id, order.getMaDonHang(), adminId) < qty)
                throw new BadRequestException("Không đủ hàng khả dụng cho " + v.getSku());
            locked.put(id, v);
        });
        if (deduct) quantities.forEach((id, qty) -> {
            BienTheSanPham v = locked.get(id);
            v.setTonKho(v.getTonKho() - qty);
            variants.save(v);
        });
        order.setStockState(deduct ? "DEDUCTED" : "RESERVED");
        orders.saveAndFlush(order);
    }

    public void release(DonHang order) {
        String state = order.getStockState();
        if ("RELEASED".equals(state)) return;
        if (state == null || "LEGACY".equals(state))
            throw new BadRequestException("Đơn cũ cần đối soát tồn kho trước khi hủy/trả hàng");
        // Lock even reserved stock, so releasing and claiming capacity serialize.
        quantities(order).forEach((id, qty) -> {
            BienTheSanPham v = lockVariant(id);
            if ("DEDUCTED".equals(state)) {
                v.setTonKho(Math.addExact(v.getTonKho(), qty));
                variants.save(v);
            }
        });
        order.setStockState("RELEASED");
        orders.saveAndFlush(order);
    }

    /**
     * Old orders were created before stock movements were tracked. An administrator
     * must explicitly confirm the real stock situation before those orders can be
     * cancelled, returned, or moved through fulfilment.
     */
    public void reconcileLegacy(DonHang order, boolean stockWasDeducted) {
        if (!"LEGACY".equals(order.getStockState())) {
            throw new BadRequestException("Đơn hàng này đã được đối soát tồn kho");
        }
        quantities(order);
        order.setStockState(stockWasDeducted ? "DEDUCTED" : "NONE");
        orders.saveAndFlush(order);
    }
}
