package com.example.zeststore.service;

import com.example.zeststore.entity.*;
import com.example.zeststore.repository.*;
import com.example.zeststore.exception.BadRequestException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.core.type.TypeReference;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.domain.*;
import java.time.*;
import java.math.BigDecimal;
import java.util.*;

@Service @RequiredArgsConstructor @Transactional
public class SalesInvoiceService {
    private final SalesInvoiceRepository invoices;
    private final DonHangRepository orders;
    private final MucDonHangRepository items;
    private final ThanhToanRepository payments;
    private final NguoiDungRepository users;
    private final ObjectMapper mapper;

    // The order lock serializes issuance with completion and retries. The unique
    // order_id constraint is the final protection against duplicate invoices.
    public SalesInvoice issue(Integer orderId, Integer actorId) {
        DonHang order = orders.findByIdForUpdate(orderId)
            .orElseThrow(() -> new BadRequestException("Không tìm thấy đơn hàng"));
        var existing = invoices.findByOrder_MaDonHang(orderId);
        if (existing.isPresent()) return existing.get();
        if (!Integer.valueOf(6).equals(order.getTrangThaiDon()))
            throw new BadRequestException("Chỉ lập hóa đơn cho đơn đã hoàn thành");
        var paid = payments.findByDonHang_MaDonHang(orderId).stream()
            .filter(p -> Integer.valueOf(2).equals(p.getTrangThaiThanhToan())).toList();
        BigDecimal collected = paid.stream().map(ThanhToan::getSoTien).reduce(BigDecimal.ZERO, BigDecimal::add);
        if (collected.compareTo(order.getTongTien()) < 0)
            throw new BadRequestException("Đơn chưa được thanh toán đủ để lập hóa đơn");
        List<MucDonHang> orderItems = items.findByDonHang_MaDonHang(orderId);
        if (orderItems.isEmpty()) throw new BadRequestException("Đơn hàng không có sản phẩm");
        SalesInvoice invoice = new SalesInvoice();
        invoice.setOrder(order);
        invoice.setCode("DRAFT-" + UUID.randomUUID());
        invoice.setIssuedAt(LocalDateTime.now());
        invoice.setIssuedById(actorId);
        invoice.setIssuedBy(actorName(actorId));
        invoice.setOrderCode(order.getMaDonHangCode());
        invoice.setOrderType(order.getLoaiDonHang());
        invoice.setCustomerName(order.getNguoiDung() != null ? order.getNguoiDung().getHoTen() : order.getTenNguoiNhan());
        invoice.setTotal(order.getTongTien());
        Map<String, Object> header = new LinkedHashMap<>();
        header.put("maDonHangCode", order.getMaDonHangCode());
        header.put("tenNguoiNhan", order.getTenNguoiNhan());
        header.put("khachHang", invoice.getCustomerName());
        header.put("sdtNguoiNhan", order.getSdtNguoiNhan());
        header.put("diaChiGiaoHang", order.getDiaChiGiaoHang());
        header.put("soTienGiam", order.getSoTienGiam());
        header.put("phiVanChuyen", order.getPhiVanChuyen());
        header.put("tongTien", order.getTongTien());
        header.put("loaiDonHang", order.getLoaiDonHang());
        header.put("trangThaiDon", 6);
        header.put("ghiChu", order.getGhiChu());
        Map<String, Object> snapshot = new LinkedHashMap<>();
        snapshot.put("donHang", header);
        snapshot.put("emailKhachHang", order.getNguoiDung() == null ? "" : order.getNguoiDung().getEmail());
        snapshot.put("thanhToans", paid.stream().map(p -> {
            Map<String, Object> value = new LinkedHashMap<>();
            value.put("phuongThuc", p.getPhuongThuc());
            value.put("trangThaiThanhToan", p.getTrangThaiThanhToan());
            value.put("soTien", p.getSoTien());
            value.put("maGiaoDich", p.getMaGiaoDich());
            return value;
        }).toList());
        try { invoice.setHeaderSnapshot(mapper.writeValueAsString(snapshot)); }
        catch (Exception ex) { throw new IllegalStateException("Không lưu được nội dung hóa đơn", ex); }
        for (MucDonHang item : orderItems) {
            SalesInvoiceLine line = new SalesInvoiceLine();
            line.setInvoice(invoice);
            var variant = item.getBienThe();
            line.setProductCode(item.getMaSanPhamSnapshot() != null ? item.getMaSanPhamSnapshot() : variant.getSanPham().getMaSanPhamCode());
            line.setProductName(item.getTenSanPhamSnapshot() != null ? item.getTenSanPhamSnapshot() : variant.getSanPham().getTenSanPham());
            line.setSku(item.getSkuSnapshot() != null ? item.getSkuSnapshot() : variant.getSku());
            String variantName = String.join(" / ", java.util.stream.Stream.of(
                variant.getMauSac() == null ? null : variant.getMauSac().getMauSac(),
                variant.getKichCo() == null ? null : variant.getKichCo().getKichCo()).filter(Objects::nonNull).toList());
            line.setVariantName(item.getBienTheSnapshot() != null ? item.getBienTheSnapshot() : variantName);
            line.setQuantity(item.getSoLuong()); line.setUnitPrice(item.getDonGia()); line.setAmount(item.getThanhTien());
            invoice.getLines().add(line);
        }
        invoices.saveAndFlush(invoice);
        invoice.setCode("HD" + String.format("%04d", invoice.getId()));
        return invoices.saveAndFlush(invoice);
    }

    private String actorName(Integer actorId) {
        if (actorId == null) return "Hệ thống ZestStore";
        return users.findById(actorId).map(NguoiDung::getHoTen)
            .orElseThrow(() -> new BadRequestException("Không tìm thấy người lập hóa đơn"));
    }
    @Transactional(readOnly = true)
    public Page<SalesInvoice> list(String q, String status, LocalDate from, LocalDate to, int page, int size) {
        if (from != null && to != null && from.isAfter(to)) throw new BadRequestException("Khoảng ngày không hợp lệ");
        return invoices.search(q == null ? "" : q.trim(), status == null || status.isBlank() ? null : status,
            from == null ? null : from.atStartOfDay(), to == null ? null : to.plusDays(1).atStartOfDay(),
            PageRequest.of(Math.max(0, page), Math.min(100, Math.max(1, size)), Sort.by(Sort.Direction.DESC, "id")));
    }
    @Transactional(readOnly = true)
    public Optional<SalesInvoice> forOrder(Integer orderId) { return invoices.findByOrder_MaDonHang(orderId); }
    @Transactional(readOnly = true)
    public Map<String, Object> detail(Long id) {
        return printData(invoices.findById(id).orElseThrow(() -> new BadRequestException("Không tìm thấy hóa đơn")));
    }
    public Map<String, Object> registerPrint(Long id) {
        SalesInvoice invoice = invoices.lockById(id).orElseThrow(() -> new BadRequestException("Không tìm thấy hóa đơn"));
        invoice.setPrintCount(invoice.getPrintCount() + 1);
        invoices.save(invoice);
        return printData(invoice);
    }
    public SalesInvoice voidInvoice(Long id, String reason, Integer actorId) {
        if (reason == null || reason.trim().isEmpty() || reason.trim().length() > 500)
            throw new BadRequestException("Nhập lý do hủy từ 1 đến 500 ký tự");
        SalesInvoice invoice = invoices.lockById(id).orElseThrow(() -> new BadRequestException("Không tìm thấy hóa đơn"));
        if ("VOID".equals(invoice.getStatus())) return invoice;
        invoice.setStatus("VOID"); invoice.setVoidedAt(LocalDateTime.now());
        invoice.setVoidedBy(actorName(actorId)); invoice.setVoidedById(actorId); invoice.setVoidReason(reason.trim());
        return invoices.save(invoice);
    }
    private Map<String, Object> printData(SalesInvoice invoice) {
        try {
            Map<String, Object> data = mapper.readValue(invoice.getHeaderSnapshot(), new TypeReference<>() {});
            data.put("documentType", "INVOICE"); data.put("invoice", invoice);
            data.put("maHoaDonCode", invoice.getCode()); data.put("ngayTao", invoice.getIssuedAt().toString());
            data.put("nguoiTaoTen", invoice.getIssuedBy()); data.put("soLanIn", invoice.getPrintCount());
            data.put("tamTinh", invoice.getLines().stream().map(SalesInvoiceLine::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add));
            data.put("chiTiet", invoice.getLines().stream().map(line -> {
                Map<String, Object> row = new LinkedHashMap<>();
                row.put("tenSanPham", line.getProductName()); row.put("maSanPhamCode", line.getProductCode());
                row.put("sku", line.getSku()); row.put("thongTinBienThe", line.getVariantName());
                row.put("donGia", line.getUnitPrice()); row.put("soLuong", line.getQuantity()); row.put("thanhTien", line.getAmount());
                return row;
            }).toList());
            return data;
        } catch (Exception ex) { throw new IllegalStateException("Không đọc được nội dung hóa đơn", ex); }
    }
}
