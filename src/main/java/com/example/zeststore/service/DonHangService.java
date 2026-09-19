package com.example.zeststore.service;

import com.example.zeststore.dto.request.OrderRequest;
import com.example.zeststore.entity.*;
import com.example.zeststore.exception.BadRequestException;
import com.example.zeststore.exception.ResourceNotFoundException;
import com.example.zeststore.repository.*;
import com.example.zeststore.util.VndUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
public class DonHangService {

    private final DonHangRepository donHangRepository;
    private final MucDonHangRepository mucDonHangRepository;
    private final GioHangRepository gioHangRepository;
    private final MucGioHangRepository mucGioHangRepository;
    private final BienTheSanPhamRepository bienTheRepository;
    private final PhieuGiamGiaRepository phieuGiamGiaRepository;
    private final NguoiDungRepository nguoiDungRepository;
    private final ThanhToanRepository thanhToanRepository;
    private final LichSuDonHangRepository lichSuDonHangRepository;
    private final OrderSseService orderSseService;
    private final ThongBaoService thongBaoService;
    private final GhnService ghnService;
    private final CheckoutShippingService checkoutShippingService;
    private final VoucherNguoiDungRepository voucherNguoiDungRepository;
    private final PhieuGiamGiaService phieuGiamGiaService;
    private final InventoryService inventoryService;
    private final CampaignDiscountService campaignDiscountService;

    @Transactional(readOnly = true)
    public List<DonHang> getOrdersByUser(Integer userId) {
        return donHangRepository.findByNguoiDung_MaNguoiDungOrderByNgayDatDesc(userId);
    }

    @Transactional(readOnly = true)
    public DonHang getOrderById(Integer orderId) {
        return donHangRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", orderId));
    }

    @Transactional(readOnly = true)
    public Page<DonHang> getAllOrders(int page, int size, Integer loaiDonHang, String q, Integer trangThai,
                                       LocalDate tuNgay, LocalDate denNgay) {
        PageRequest pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "ngayDat"));
        boolean hasSearch = q != null && !q.trim().isEmpty();
        boolean hasLoai = loaiDonHang != null;
        boolean hasTrangThai = trangThai != null;
        boolean hasDate = tuNgay != null && denNgay != null;

        if (hasDate) {
            LocalDateTime from = tuNgay.atStartOfDay();
            LocalDateTime to = denNgay.plusDays(1).atStartOfDay();
            if (hasSearch) {
                if (hasLoai && hasTrangThai) {
                    return donHangRepository.searchByKeywordAndLoaiAndTrangThaiAndNgayDatBetween(q.trim(), loaiDonHang, trangThai, from, to, pageable);
                }
                if (hasLoai) {
                    return donHangRepository.searchByKeywordAndLoaiAndNgayDatBetween(q.trim(), loaiDonHang, from, to, pageable);
                }
                if (hasTrangThai) {
                    return donHangRepository.searchByKeywordAndTrangThaiAndNgayDatBetween(q.trim(), trangThai, from, to, pageable);
                }
                return donHangRepository.searchByKeywordAndNgayDatBetween(q.trim(), from, to, pageable);
            }
            if (hasLoai && hasTrangThai) {
                return donHangRepository.findByLoaiDonHangAndTrangThaiDonAndNgayDatBetween(loaiDonHang, trangThai, from, to, pageable);
            }
            if (hasLoai) {
                return donHangRepository.findByLoaiDonHangAndNgayDatBetween(loaiDonHang, from, to, pageable);
            }
            if (hasTrangThai) {
                return donHangRepository.findByTrangThaiDonAndNgayDatInRange(trangThai, from, to, pageable);
            }
            return donHangRepository.findByNgayDatInRange(from, to, pageable);
        }

        if (hasSearch) {
            if (hasLoai && hasTrangThai) {
                return donHangRepository.searchByKeywordAndLoaiAndTrangThai(q.trim(), loaiDonHang, trangThai, pageable);
            }
            if (hasTrangThai) {
                return donHangRepository.searchByKeywordAndTrangThai(q.trim(), trangThai, pageable);
            }
            if (hasLoai) {
                return donHangRepository.searchByKeywordAndLoai(q.trim(), loaiDonHang, pageable);
            }
            return donHangRepository.searchByKeyword(q.trim(), pageable);
        }
        if (hasLoai && hasTrangThai) {
            return donHangRepository.findByLoaiDonHangAndTrangThaiDon(loaiDonHang, trangThai, pageable);
        }
        if (hasTrangThai) {
            return donHangRepository.findByTrangThaiDon(trangThai, pageable);
        }
        if (hasLoai) {
            return donHangRepository.findByLoaiDonHang(loaiDonHang, pageable);
        }
        return donHangRepository.findAll(pageable);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getOrderDetail(Integer orderId) {
        DonHang order = donHangRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", orderId));
        List<MucDonHang> items = mucDonHangRepository.findByDonHang_MaDonHang(orderId);
        List<ThanhToan> payments = thanhToanRepository.findByDonHang_MaDonHang(orderId);

        List<LichSuDonHang> history = lichSuDonHangRepository.findByDonHang_MaDonHangOrderByThoiGianDesc(orderId);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("order", order);
        result.put("items", items);
        result.put("payments", payments);
        result.put("history", history);
        return result;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> lookupOrder(String maDonHangCode, String email) {
        DonHang order = donHangRepository.findByMaDonHangCodeAndEmail(maDonHangCode, email)
                .orElseThrow(() -> new ResourceNotFoundException("Order", maDonHangCode));
        List<MucDonHang> items = mucDonHangRepository.findByDonHang_MaDonHang(order.getMaDonHang());
        List<ThanhToan> payments = thanhToanRepository.findByDonHang_MaDonHang(order.getMaDonHang());
        List<LichSuDonHang> history = lichSuDonHangRepository.findByDonHang_MaDonHangOrderByThoiGianDesc(order.getMaDonHang());

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("order", order);
        result.put("items", items);
        result.put("payments", payments);
        result.put("history", history.stream()
                .filter(h -> h.getKhachHangXem() == null || Boolean.TRUE.equals(h.getKhachHangXem())).toList());
        return result;
    }

    @Transactional
    public Map<String, Object> registerPrint(Integer orderId, boolean isAdmin) {
        DonHang order = donHangRepository.findByIdForUpdate(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", orderId));
        assertCanPrint(order, isAdmin);
        order.setSoLanIn(order.getSoLanIn() == null ? 1 : order.getSoLanIn() + 1);
        donHangRepository.save(order);
        return buildPrintData(order, isAdmin);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getOrderPrintData(Integer orderId, boolean isAdmin) {
        return buildPrintData(getOrderById(orderId), isAdmin);
    }

    private void assertCanPrint(DonHang order, boolean isAdmin) {
        if (order.getLoaiDonHang() != null && order.getLoaiDonHang() == 2) {
            return;
        }
        Integer status = order.getTrangThaiDon();
        if (status != null && status == 1) {
            throw new BadRequestException("Đơn hàng chưa được xác nhận nên chưa thể in.");
        }
        if (status != null && status == 5 && !isAdmin) {
            throw new BadRequestException("Đơn hàng đã hủy. Chỉ quản lý mới được in hóa đơn.");
        }
    }

    private Map<String, Object> buildPrintData(DonHang order, boolean isAdmin) {
        assertCanPrint(order, isAdmin);
        List<MucDonHang> items = mucDonHangRepository.findByDonHang_MaDonHang(order.getMaDonHang());

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("maHoaDonCode", "HD-" + order.getMaDonHang());
        result.put("soLanIn", order.getSoLanIn() == null ? 0 : order.getSoLanIn());
        result.put("ngayTao", order.getNgayDat());
        result.put("emailKhachHang",
                order.getNguoiDung() != null && order.getNguoiDung().getEmail() != null ? order.getNguoiDung().getEmail() : "");

        Map<String, Object> orderInfo = new LinkedHashMap<>();
        orderInfo.put("maDonHang", order.getMaDonHang());
        orderInfo.put("maDonHangCode", order.getMaDonHangCode());
        orderInfo.put("tenNguoiNhan", order.getTenNguoiNhan());
        orderInfo.put("sdtNguoiNhan", order.getSdtNguoiNhan());
        orderInfo.put("diaChiGiaoHang", order.getDiaChiGiaoHang());
        orderInfo.put("ngayDat", order.getNgayDat());
        orderInfo.put("soTienGiam", order.getSoTienGiam());
        orderInfo.put("phiVanChuyen", order.getPhiVanChuyen());
        orderInfo.put("tongTien", order.getTongTien());
        orderInfo.put("loaiDonHang", order.getLoaiDonHang());
        orderInfo.put("ghiChu", order.getGhiChu());
        orderInfo.put("khachHang", order.getNguoiDung() != null ? order.getNguoiDung().getHoTen() : order.getTenNguoiNhan());
        result.put("donHang", orderInfo);

        result.put("chiTiet", items.stream().map(item -> {
            Map<String, Object> im = new LinkedHashMap<>();
            im.put("maSanPhamCode", item.getBienThe().getSanPham().getMaSanPhamCode());
            im.put("sku", item.getBienThe().getSku());
            im.put("tenSanPham", item.getBienThe().getSanPham().getTenSanPham());
            String thongTin = "";
            if (item.getBienThe().getMauSac() != null) thongTin += item.getBienThe().getMauSac().getMauSac();
            if (item.getBienThe().getKichCo() != null) thongTin += (thongTin.isEmpty() ? "" : " / ") + item.getBienThe().getKichCo().getKichCo();
            im.put("thongTinBienThe", thongTin);
            im.put("donGia", item.getDonGia());
            im.put("soLuong", item.getSoLuong());
            im.put("thanhTien", item.getThanhTien());
            return im;
        }).collect(java.util.stream.Collectors.toList()));

        BigDecimal tamTinh = items.stream()
                .map(MucDonHang::getThanhTien)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        result.put("tamTinh", tamTinh);

        List<Map<String, Object>> paymentInfo = thanhToanRepository.findByDonHang_MaDonHang(order.getMaDonHang())
                .stream().map(t -> {
                    Map<String, Object> pm = new LinkedHashMap<>();
                    pm.put("phuongThuc", t.getPhuongThuc());
                    pm.put("trangThaiThanhToan", t.getTrangThaiThanhToan());
                    pm.put("soTien", t.getSoTien());
                    pm.put("nhaCungCap", t.getNhaCungCap());
                    pm.put("maGiaoDich", t.getMaGiaoDich());
                    pm.put("thoiGianTt", t.getThoiGianTt());
                    return pm;
                }).collect(java.util.stream.Collectors.toList());
        result.put("thanhToans", paymentInfo);

        return result;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getOrderDetailForUser(Integer orderId, Integer userId) {
        DonHang order = donHangRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", orderId));
        // Đơn khách lẻ tại quầy không có chủ — không cho xem qua cổng khách hàng
        if (order.getNguoiDung() == null || !order.getNguoiDung().getMaNguoiDung().equals(userId)) {
            throw new BadRequestException("Order does not belong to current user");
        }
        Map<String, Object> result = getOrderDetail(orderId);
        result.put("history", ((List<LichSuDonHang>) result.get("history")).stream()
                .filter(h -> h.getKhachHangXem() == null || Boolean.TRUE.equals(h.getKhachHangXem())).toList());
        return result;
    }

    @Transactional
    public Map<String, Object> placeOrder(Integer userId, OrderRequest request) {
        NguoiDung user = nguoiDungRepository.findByIdForUpdate(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));
        if (request.getCheckoutKey() == null || request.getCheckoutKey().isBlank())
            throw new BadRequestException("Thiếu mã xác nhận đơn hàng");
        String checkoutKey = "WEB:" + userId + ":" + request.getCheckoutKey().trim();
        DonHang previous = donHangRepository.findByCheckoutKey(checkoutKey).orElse(null);
        if (previous != null) {
            ThanhToan payment = thanhToanRepository.findByDonHang_MaDonHang(previous.getMaDonHang()).stream()
                    .findFirst().orElseThrow(() -> new BadRequestException("Không tìm thấy thanh toán"));
            return Map.of("maDonHang", previous.getMaDonHang(), "tongTien", previous.getTongTien(),
                    "phuongThucThanhToan", payment.getPhuongThuc(), "trangThai", previous.getTrangThaiDon());
        }

        GioHang cart = gioHangRepository.findByNguoiDung_MaNguoiDung(userId)
                .orElseThrow(() -> new BadRequestException("Cart is empty"));

        List<MucGioHang> cartItems = mucGioHangRepository.findByGioHang_MaGioHang(cart.getMaGioHang());
        if (cartItems.isEmpty()) {
            throw new BadRequestException("Cart is empty");
        }

        if (request.getMaBienTheList() != null && !request.getMaBienTheList().isEmpty()) {
            cartItems = cartItems.stream()
                    .filter(ci -> request.getMaBienTheList().contains(ci.getBienThe().getMaBienThe()))
                    .collect(java.util.stream.Collectors.toList());
            if (cartItems.isEmpty()) {
                throw new BadRequestException("No matching items in cart");
            }
        }

        // Match POS/reservation lock ordering: variants by ID, then coupons.
        cartItems = cartItems.stream()
                .sorted(Comparator.comparing(i -> i.getBienThe().getMaBienThe())).toList();
        BigDecimal tongTien = BigDecimal.ZERO;
        List<Map<String, Object>> orderItems = new ArrayList<>();

        // Giá KM chương trình theo từng biến thể — chốt vào đơn hàng
        java.util.Set<Integer> orderVariantIds = new java.util.HashSet<>();
        for (MucGioHang cartItem : cartItems) {
            orderVariantIds.add(cartItem.getBienThe().getMaBienThe());
        }
        Map<Integer, BigDecimal> pctMap = campaignDiscountService.pctByVariantIds(orderVariantIds);

        for (MucGioHang cartItem : cartItems) {
            BienTheSanPham variant = inventoryService.lockVariant(cartItem.getBienThe().getMaBienThe());
            if (cartItem.getSoLuong() == null || cartItem.getSoLuong() <= 0)
                throw new BadRequestException("Số lượng sản phẩm phải lớn hơn 0");
            if (variant.getNgayXoa() != null || !Integer.valueOf(1).equals(variant.getTrangThai())
                    || variant.getSanPham().getNgayXoa() != null || !Integer.valueOf(1).equals(variant.getSanPham().getTrangThai()))
                throw new BadRequestException("Sản phẩm đã ngừng bán: " + variant.getSku());
            if (variant.getTonKho() < cartItem.getSoLuong()) {
                throw new BadRequestException("Insufficient stock for " + variant.getSku());
            }
            BigDecimal donGia = CampaignDiscountService.discountedPrice(
                    variant.getGia(), pctMap.get(variant.getMaBienThe()));
            BigDecimal thanhTien = donGia.multiply(BigDecimal.valueOf(cartItem.getSoLuong()));
            tongTien = tongTien.add(thanhTien);

            Map<String, Object> itemMap = new LinkedHashMap<>();
            itemMap.put("bienThe", variant);
            itemMap.put("donGia", donGia);
            itemMap.put("soLuong", cartItem.getSoLuong());
            itemMap.put("thanhTien", thanhTien);
            orderItems.add(itemMap);
        }

        List<Integer> productIds = cartItems.stream().map(i -> i.getBienThe().getSanPham().getMaSanPham()).distinct().toList();
        // Lock coupons in a deterministic order, including when both coupon types are used.
        java.util.stream.Stream.of(request.getMaCode(), request.getMaCodeFreeship())
                .filter(c -> c != null && !c.isBlank()).map(String::trim).distinct().sorted()
                .forEach(c -> phieuGiamGiaRepository.findByMaCodeForUpdate(c)
                        .orElseThrow(() -> new BadRequestException("Mã giảm giá không hợp lệ")));
        BigDecimal soTienGiam = BigDecimal.ZERO;
        PhieuGiamGia coupon = null;
        if (request.getMaCode() != null && !request.getMaCode().isEmpty()) {
            coupon = phieuGiamGiaRepository.findByMaCodeForUpdate(request.getMaCode().trim())
                    .orElseThrow(() -> new BadRequestException("Mã giảm giá không hợp lệ"));

            phieuGiamGiaService.validateCoupon(coupon.getMaCode(), tongTien, productIds, userId);

            if (!Integer.valueOf(1).equals(coupon.getTrangThai())) {
                throw new BadRequestException("Mã giảm giá đã ngừng hoạt động");
            }
            if (coupon.getNgayBatDau() != null && LocalDateTime.now().isBefore(coupon.getNgayBatDau())) {
                throw new BadRequestException("Mã giảm giá chưa đến hạn sử dụng");
            }
            if (coupon.getNgayKetThuc() != null && LocalDateTime.now().isAfter(coupon.getNgayKetThuc())) {
                throw new BadRequestException("Mã giảm giá đã hết hạn");
            }
            if (coupon.getSoLuong() != null && coupon.getSoLuong() <= 0) {
                throw new BadRequestException("Mã giảm giá đã hết lượt sử dụng");
            }
            if (coupon.getGiaTriDonToiThieu() != null && tongTien.compareTo(coupon.getGiaTriDonToiThieu()) < 0) {
                throw new BadRequestException("Chưa đạt giá trị đơn tối thiểu để áp dụng mã này");
            }
            if (Integer.valueOf(3).equals(coupon.getKieuGiamGia())) {
                throw new BadRequestException("Mã freeship chỉ áp dụng ở mục miễn phí vận chuyển");
            }

            Map<Integer, BigDecimal> productSubtotals = new LinkedHashMap<>();
            orderItems.forEach(item -> productSubtotals.merge(
                    ((BienTheSanPham) item.get("bienThe")).getSanPham().getMaSanPham(),
                    (BigDecimal) item.get("thanhTien"), BigDecimal::add));
            soTienGiam = phieuGiamGiaService.calculateDiscount(coupon, tongTien, productSubtotals);
        }

        BigDecimal phiVanChuyen = recalculateShippingFee(request, orderItems);

        PhieuGiamGia freeshipCoupon = null;
        if (request.getMaCodeFreeship() != null && !request.getMaCodeFreeship().isEmpty()) {
            freeshipCoupon = phieuGiamGiaRepository.findByMaCodeForUpdate(request.getMaCodeFreeship().trim())
                    .orElseThrow(() -> new BadRequestException("Mã freeship không hợp lệ"));
            phieuGiamGiaService.validateCoupon(freeshipCoupon.getMaCode(), tongTien, productIds, userId);
            if (coupon != null && (Boolean.TRUE.equals(coupon.getExclusive()) || Boolean.TRUE.equals(freeshipCoupon.getExclusive())))
                throw new BadRequestException("Mã giảm giá này không được dùng đồng thời với mã khác");
            if (!Integer.valueOf(3).equals(freeshipCoupon.getKieuGiamGia())) {
                throw new BadRequestException("Mã này không phải mã freeship");
            }
            if (!Integer.valueOf(1).equals(freeshipCoupon.getTrangThai())) {
                throw new BadRequestException("Mã freeship đã ngừng hoạt động");
            }
            if (freeshipCoupon.getNgayBatDau() != null && LocalDateTime.now().isBefore(freeshipCoupon.getNgayBatDau())) {
                throw new BadRequestException("Mã freeship chưa đến hạn sử dụng");
            }
            if (freeshipCoupon.getNgayKetThuc() != null && LocalDateTime.now().isAfter(freeshipCoupon.getNgayKetThuc())) {
                throw new BadRequestException("Mã freeship đã hết hạn");
            }
            BigDecimal giamShip = (freeshipCoupon.getGiaTriGiam() == null || freeshipCoupon.getGiaTriGiam().compareTo(BigDecimal.ZERO) == 0)
                ? phiVanChuyen
                : freeshipCoupon.getGiaTriGiam().min(phiVanChuyen);
            phiVanChuyen = phiVanChuyen.subtract(giamShip).max(BigDecimal.ZERO);
        }
        BigDecimal finalTotal = tongTien.subtract(soTienGiam).add(phiVanChuyen);
        if (finalTotal.compareTo(BigDecimal.ZERO) < 0) {
            finalTotal = BigDecimal.ZERO;
        }

        if (request.getExpectedTotal() != null && request.getExpectedTotal().compareTo(finalTotal) != 0)
            throw new BadRequestException("Giá/khuyến mãi hoặc phí vận chuyển đã thay đổi. Vui lòng tải lại giỏ hàng trước khi thanh toán");
        DonHang order = DonHang.builder()
                .checkoutKey(checkoutKey)
                .nguoiDung(user)
                .phieuGiamGia(coupon)
                .soTienGiam(soTienGiam)
                .phiVanChuyen(phiVanChuyen)
                .tongTien(finalTotal)
                .trangThaiDon(1)
                .tenNguoiNhan(request.getTenNguoiNhan())
                .sdtNguoiNhan(request.getSdtNguoiNhan())
                .diaChiGiaoHang(request.getDiaChiGiaoHang())
                .ghiChu(request.getGhiChu())
                .build();
        order = donHangRepository.save(order);
        // Mã đơn ngắn, ổn định và đồng nhất với mã sản phẩm (ví dụ: DH0013).
        order.setMaDonHangCode(String.format("DH%04d", order.getMaDonHang()));
        order = donHangRepository.save(order);

        for (Map<String, Object> item : orderItems) {
            BienTheSanPham variant = (BienTheSanPham) item.get("bienThe");
            mucDonHangRepository.save(MucDonHang.builder()
                    .donHang(order)
                    .bienThe(variant)
                    .donGia((BigDecimal) item.get("donGia"))
                    .soLuong((Integer) item.get("soLuong"))
                    .thanhTien((BigDecimal) item.get("thanhTien"))
                    .build());
        }

        inventoryService.reserve(order);

        String paymentRef = "ORD-" + order.getMaDonHang() + "-" + System.currentTimeMillis();
        String nhaCungCap = switch (request.getPhuongThucThanhToan()) {
            case 2 -> "VNPay";
            case 3 -> "MoMo";
            case 4 -> "ZaloPay";
            default -> "Tiền mặt";
        };
        boolean isWalletPayment = false;

        thanhToanRepository.save(ThanhToan.builder()
                .donHang(order)
                .phuongThuc(request.getPhuongThucThanhToan())
                .nhaCungCap(nhaCungCap)
                .trangThaiThanhToan(isWalletPayment ? 2 : 1)
                .soTien(finalTotal)
                .maGiaoDich(paymentRef)
                .thoiGianTt(isWalletPayment ? LocalDateTime.now() : null)
                .build());

                lichSuDonHangRepository.save(LichSuDonHang.builder()
                .donHang(order)
                .trangThaiCu(null)
                .trangThaiMoi(1)
                .nguoiCapNhat(user)
                .build());

        if (Integer.valueOf(1).equals(request.getPhuongThucThanhToan())) {
            mucGioHangRepository.deleteAll(cartItems);
        }

        if (coupon != null) {
            phieuGiamGiaService.useCoupon(coupon.getMaCode(), user.getMaNguoiDung(),
                    order.getMaDonHang(), soTienGiam, "ONLINE");
        }
        if (freeshipCoupon != null) {
            phieuGiamGiaService.useCoupon(freeshipCoupon.getMaCode(), user.getMaNguoiDung(),
                    order.getMaDonHang(), BigDecimal.ZERO, "ONLINE_FREESHIP");
        }

        // Notify the buyer that the order has been placed (links to their own order detail).
        try {
            thongBaoService.taoThongBao(
                    user.getMaNguoiDung(),
                    "Đặt hàng thành công #" + order.getMaDonHang(),
                    "Cảm ơn " + user.getHoTen() + "! Đơn hàng #" + order.getMaDonHang()
                            + " đã được đặt thành công.",
                    "DON_HANG_MOI",
                    "/orders/" + order.getMaDonHang());
        } catch (Exception ignored) {}

        // Notify all admins/staff that a new order has just been placed.
        try {
            thongBaoService.taoThongBaoChoAdmin(
                    "Đơn hàng mới #" + order.getMaDonHang(),
                    "Khách hàng " + user.getHoTen() + " vừa đặt đơn #" + order.getMaDonHang()
                            + " — tổng " + VndUtil.format(finalTotal) + "₫.",
                    "DON_HANG_MOI",
                    "/admin/orders/" + order.getMaDonHang());
        } catch (Exception ignored) {}

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("maDonHang", order.getMaDonHang());
        result.put("tongTien", finalTotal);
        result.put("soTienGiam", soTienGiam);
        result.put("phiVanChuyen", phiVanChuyen);
        result.put("trangThai", order.getTrangThaiDon());
        result.put("phuongThucThanhToan", request.getPhuongThucThanhToan());
        result.put("message", "Order placed successfully");
        return result;
    }

    @Transactional
    public DonHang updateOrderStatus(Integer orderId, Integer status, String note, boolean notifyCustomer, Integer adminUserId) {
        List<Integer> validStatuses = List.of(2, 3, 4, 5, 6, 7, 8, 9);
        if (!validStatuses.contains(status)) {
            throw new BadRequestException("Invalid status: " + status);
        }
        DonHang order = donHangRepository.findByIdForUpdate(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", orderId));
        Integer oldStatus = order.getTrangThaiDon();
        if (Objects.equals(oldStatus, status)) return order;
        Map<Integer, List<Integer>> transitions = Map.of(
                1, List.of(2, 5), 2, List.of(3, 5), 3, List.of(4, 5),
                4, List.of(6, 9));
        if (!transitions.getOrDefault(oldStatus, List.of()).contains(status))
            throw new BadRequestException("Không thể chuyển trạng thái đơn hàng; trả hàng phải qua yêu cầu trả hàng");
        if (Integer.valueOf(5).equals(status)) {
            cancelLockedOrder(order);
        }

        if (Integer.valueOf(2).equals(status) || Integer.valueOf(6).equals(status)
                || Integer.valueOf(3).equals(status) || Integer.valueOf(4).equals(status)) {
            boolean hasUnpaidOnline = thanhToanRepository.findByDonHang_MaDonHang(orderId).stream()
                    .anyMatch(t -> t.getPhuongThuc() > 1 && !Integer.valueOf(2).equals(t.getTrangThaiThanhToan()));
            if (hasUnpaidOnline) {
                throw new BadRequestException("Đơn hàng có thanh toán online chưa được thanh toán");
            }
        }

        if (Integer.valueOf(2).equals(status)) {
            inventoryService.deduct(order);
        }
        if (Integer.valueOf(9).equals(status)) {
            cancelLockedOrder(order);
        }

        if (Integer.valueOf(6).equals(status)) {
            thanhToanRepository.findByDonHang_MaDonHang(orderId).stream()
                    .filter(t -> Integer.valueOf(1).equals(t.getPhuongThuc()))
                    .findFirst()
                    .ifPresent(t -> {
                        t.setTrangThaiThanhToan(2);
                        t.setThoiGianTt(LocalDateTime.now());
                        thanhToanRepository.save(t);
                    });
        }

        order.setTrangThaiDon(status);
        order = donHangRepository.save(order);

        NguoiDung admin = nguoiDungRepository.findById(adminUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User", adminUserId));
        String normalizedNote = note == null ? null : note.trim();
        if (normalizedNote != null && normalizedNote.isEmpty()) normalizedNote = null;
        lichSuDonHangRepository.save(LichSuDonHang.builder()
                .donHang(order)
                .trangThaiCu(oldStatus)
                .trangThaiMoi(status)
                .nguoiCapNhat(admin)
                .ghiChu(normalizedNote)
                .khachHangXem(notifyCustomer)
                .build());

        orderSseService.sendOrderStatusUpdate(orderId, status, oldStatus, "admin", notifyCustomer ? normalizedNote : null);

        // Notify the order's customer that its status changed (status map: 1=Chờ,2=ĐãXL,3=ĐangGiao,4=ĐãGiao,5=ĐãHủy,6=Hoàn thành,7=Trả hàng).
        if (notifyCustomer && order.getNguoiDung() != null) {
            String trangThaiText = switch (status) {
                case 2 -> "đang được xử lý";
                case 3 -> "đang được giao";
                case 4 -> "đã được giao";
                case 6 -> "giao hàng thành công";
                case 9 -> "giao hàng không thành công";
                default -> "đã được cập nhật";
            };
            try {
                thongBaoService.taoThongBao(
                        order.getNguoiDung().getMaNguoiDung(),
                        "Đơn hàng #" + orderId + " " + trangThaiText,
                        "Đơn hàng #" + orderId + " của bạn " + trangThaiText + ".",
                        "DON_HANG_CAP_NHAT",
                        "/orders/" + orderId);
            } catch (Exception ignored) {}
        }

        return order;
    }

    @Transactional
    public DonHang reconcileLegacyInventory(Integer orderId, boolean stockWasDeducted) {
        DonHang order = donHangRepository.findByIdForUpdate(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", orderId));
        if (List.of(5, 8).contains(order.getTrangThaiDon())) {
            throw new BadRequestException("Không thể đối soát tồn kho cho đơn đã kết thúc");
        }
        inventoryService.reconcileLegacy(order, stockWasDeducted);
        return order;
    }

    @Transactional
    public Map<String, String> confirmReceived(Integer orderId, Integer userId) {
        DonHang order = donHangRepository.findByIdForUpdate(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", orderId));
        if (order.getNguoiDung() == null || !order.getNguoiDung().getMaNguoiDung().equals(userId)) {
            throw new BadRequestException("Order does not belong to user");
        }
        if (!Integer.valueOf(4).equals(order.getTrangThaiDon())) {
            throw new BadRequestException("Can only confirm received orders that are delivered");
        }

        boolean hasUnpaidOnline = thanhToanRepository.findByDonHang_MaDonHang(orderId).stream()
                .anyMatch(t -> t.getPhuongThuc() > 1 && !Integer.valueOf(2).equals(t.getTrangThaiThanhToan()));
        if (hasUnpaidOnline) {
            throw new BadRequestException("Đơn hàng có thanh toán online chưa được thanh toán");
        }

        Integer oldStatus = order.getTrangThaiDon();
        order.setTrangThaiDon(6);

        thanhToanRepository.findByDonHang_MaDonHang(orderId).stream()
                .filter(t -> Integer.valueOf(1).equals(t.getPhuongThuc()))
                .findFirst()
                .ifPresent(t -> {
                    t.setTrangThaiThanhToan(2);
                    t.setThoiGianTt(LocalDateTime.now());
                    thanhToanRepository.save(t);
                });

        donHangRepository.save(order);

        NguoiDung user = nguoiDungRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));
        lichSuDonHangRepository.save(LichSuDonHang.builder()
                .donHang(order)
                .trangThaiCu(oldStatus)
                .trangThaiMoi(6)
                .nguoiCapNhat(user)
                .build());

        orderSseService.sendOrderStatusUpdate(orderId, 6, oldStatus, "user", null);

        return Map.of("message", "Order confirmed as received");
    }

    private BigDecimal recalculateShippingFee(OrderRequest request, List<Map<String, Object>> orderItems) {
        int quantity = orderItems.stream().mapToInt(item -> (Integer) item.get("soLuong")).sum();
        return checkoutShippingService.calculate(request.getToDistrictId(), request.getToWardCode(), quantity);
    }

    private void cancelLockedOrder(DonHang order) {
        boolean hasSuccessfulPayment = thanhToanRepository.findByDonHang_MaDonHang(order.getMaDonHang()).stream()
                .anyMatch(payment -> Integer.valueOf(2).equals(payment.getTrangThaiThanhToan()));
        if (hasSuccessfulPayment) {
            throw new BadRequestException("Đơn đã thanh toán; cần hoàn tiền thành công trước khi hủy đơn");
        }
        inventoryService.release(order);
        phieuGiamGiaService.restoreForOrder(order.getMaDonHang());
        for (ThanhToan payment : thanhToanRepository.findByDonHang_MaDonHang(order.getMaDonHang())) {
            if (!Integer.valueOf(2).equals(payment.getTrangThaiThanhToan())) payment.setTrangThaiThanhToan(3);
            thanhToanRepository.save(payment);
        }
    }

    @Transactional
    public Map<String, String> cancelOrder(Integer orderId, Integer userId) {
        DonHang order = donHangRepository.findByIdForUpdate(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", orderId));
        if (order.getNguoiDung() == null || !order.getNguoiDung().getMaNguoiDung().equals(userId)) {
            throw new BadRequestException("Order does not belong to user");
        }
        Integer stt = order.getTrangThaiDon();
        if (Integer.valueOf(5).equals(stt)) return Map.of("message", "Order cancelled");
        if (!Integer.valueOf(1).equals(stt) && !Integer.valueOf(2).equals(stt) && !Integer.valueOf(3).equals(stt)) {
            throw new BadRequestException("Chỉ có thể hủy đơn ở trạng thái chờ xác nhận, đã xác nhận hoặc chờ giao hàng");
        }

        cancelLockedOrder(order);

        Integer oldStatus = order.getTrangThaiDon();
        order.setTrangThaiDon(5);
        donHangRepository.save(order);

        NguoiDung user = nguoiDungRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));
        lichSuDonHangRepository.save(LichSuDonHang.builder()
                .donHang(order)
                .trangThaiCu(oldStatus)
                .trangThaiMoi(5)
                .nguoiCapNhat(user)
                .build());

        orderSseService.sendOrderStatusUpdate(orderId, 5, oldStatus, "user", null);

        return Map.of("message", "Order cancelled");
    }
}
