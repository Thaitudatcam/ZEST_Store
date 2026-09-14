package com.example.zeststore.service;

import com.example.zeststore.dto.request.OrderRequest;
import com.example.zeststore.entity.*;
import com.example.zeststore.exception.BadRequestException;
import com.example.zeststore.exception.ResourceNotFoundException;
import com.example.zeststore.repository.*;
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
    private final VoucherNguoiDungRepository voucherNguoiDungRepository;
    private final PhieuGiamGiaService phieuGiamGiaService;
    private final ViService viService;
    private final DiemService diemService;

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
            }
            if (hasLoai && hasTrangThai) {
                return donHangRepository.findByLoaiDonHangAndTrangThaiDonAndNgayDatBetween(loaiDonHang, trangThai, from, to, pageable);
            }
            if (hasLoai) {
                return donHangRepository.findByLoaiDonHangAndNgayDatBetween(loaiDonHang, from, to, pageable);
            }
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
        DonHang order = getOrderById(orderId);
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

    @Transactional
    public Map<String, Object> registerPrint(Integer orderId, boolean isAdmin) {
        DonHang order = getOrderById(orderId);
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
        orderInfo.put("soTienGiamDiem", order.getSoTienGiamDiem());
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
        DonHang order = getOrderById(orderId);
        if (!order.getNguoiDung().getMaNguoiDung().equals(userId)) {
            throw new BadRequestException("Order does not belong to current user");
        }
        return getOrderDetail(orderId);
    }

    @Transactional
    public Map<String, Object> placeOrder(Integer userId, OrderRequest request) {
        NguoiDung user = nguoiDungRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));

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

        BigDecimal tongTien = BigDecimal.ZERO;
        List<Map<String, Object>> orderItems = new ArrayList<>();

        for (MucGioHang cartItem : cartItems) {
            // Khóa dòng biến thể (PESSIMISTIC_WRITE) trước khi kiểm tra để 2 đơn
            // đặt đồng thời không cùng đọc 1 mức tồn kho cũ rồi bán vượt quá tồn.
            BienTheSanPham variant = bienTheRepository.findByIdForUpdate(cartItem.getBienThe().getMaBienThe())
                    .orElseThrow(() -> new ResourceNotFoundException("Variant", cartItem.getBienThe().getMaBienThe()));
            if (variant.getTonKho() < cartItem.getSoLuong()) {
                throw new BadRequestException("Insufficient stock for " + variant.getSku());
            }
            BigDecimal thanhTien = variant.getGia().multiply(BigDecimal.valueOf(cartItem.getSoLuong()));
            tongTien = tongTien.add(thanhTien);

            Map<String, Object> itemMap = new LinkedHashMap<>();
            itemMap.put("bienThe", variant);
            itemMap.put("donGia", variant.getGia());
            itemMap.put("soLuong", cartItem.getSoLuong());
            itemMap.put("thanhTien", thanhTien);
            orderItems.add(itemMap);
        }

        BigDecimal soTienGiam = BigDecimal.ZERO;
        PhieuGiamGia coupon = null;
        if (request.getMaCode() != null && !request.getMaCode().isEmpty()) {
            coupon = phieuGiamGiaRepository.findByMaCodeForUpdate(request.getMaCode())
                    .orElseThrow(() -> new BadRequestException("Mã giảm giá không hợp lệ"));

            if (phieuGiamGiaService.isCouponUsedByUser(coupon, user.getMaNguoiDung())) {
                throw new BadRequestException("Mã giảm giá đã được sử dụng");
            }

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

            if (Integer.valueOf(1).equals(coupon.getKieuGiamGia())) {
                soTienGiam = tongTien.multiply(coupon.getGiaTriGiam())
                        .divide(BigDecimal.valueOf(100));
            } else {
                soTienGiam = coupon.getGiaTriGiam();
            }
            if (soTienGiam.compareTo(tongTien) > 0) {
                soTienGiam = tongTien;
            }
            if (coupon.getGiaTriGiamToiDa() != null && soTienGiam.compareTo(coupon.getGiaTriGiamToiDa()) > 0) {
                soTienGiam = coupon.getGiaTriGiamToiDa();
            }
        }

        BigDecimal phiVanChuyen = recalculateShippingFee(request, orderItems);

        PhieuGiamGia freeshipCoupon = null;
        if (request.getMaCodeFreeship() != null && !request.getMaCodeFreeship().isEmpty()) {
            freeshipCoupon = phieuGiamGiaRepository.findByMaCodeForUpdate(request.getMaCodeFreeship())
                    .orElseThrow(() -> new BadRequestException("Mã freeship không hợp lệ"));
            if (phieuGiamGiaService.isCouponUsedByUser(freeshipCoupon, user.getMaNguoiDung())) {
                throw new BadRequestException("Mã freeship đã được sử dụng");
            }
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

        BigDecimal tienGiamDiem = BigDecimal.ZERO;
        Integer soDiemSuDung = request.getSoDiemSuDung();
        if (soDiemSuDung != null && soDiemSuDung > 0) {
            int maxDiem = diemService.maxDiemChoPhep(tongTien.subtract(soTienGiam).max(BigDecimal.ZERO));
            if (soDiemSuDung > maxDiem) {
                soDiemSuDung = maxDiem;
            }
            if (soDiemSuDung > 0 && soDiemSuDung < diemService.diemToiThieu()) {
                throw new BadRequestException("Tối thiểu " + diemService.diemToiThieu() + " điểm để sử dụng");
            }
            tienGiamDiem = BigDecimal.valueOf(diemService.tinhTienGiam(soDiemSuDung));
            if (tienGiamDiem.compareTo(finalTotal) > 0) {
                throw new BadRequestException("Số điểm giảm không được vượt quá tổng tiền thanh toán");
            }
        }
        BigDecimal tienSauVoucher = finalTotal;
        finalTotal = finalTotal.subtract(tienGiamDiem).max(BigDecimal.ZERO);

        DonHang order = DonHang.builder()
                .nguoiDung(user)
                .phieuGiamGia(coupon)
                .maDonHangCode("ORD-" + System.currentTimeMillis())
                .soTienGiam(soTienGiam)
                .phiVanChuyen(phiVanChuyen)
                .tongTien(tienSauVoucher)
                .soTienGiamDiem(tienGiamDiem)
                .trangThaiDon(1)
                .tenNguoiNhan(request.getTenNguoiNhan())
                .sdtNguoiNhan(request.getSdtNguoiNhan())
                .diaChiGiaoHang(request.getDiaChiGiaoHang())
                .ghiChu(request.getGhiChu())
                .build();
        order = donHangRepository.save(order);

        if (soDiemSuDung != null && soDiemSuDung > 0) {
            diemService.truDiem(userId, soDiemSuDung, order.getMaDonHang(), "ONLINE");
        }

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

        String paymentRef = "ORD-" + order.getMaDonHang() + "-" + System.currentTimeMillis();
        String nhaCungCap = switch (request.getPhuongThucThanhToan()) {
            case 2 -> "VNPay";
            case 3 -> "MoMo";
            case 4 -> "ZaloPay";
            case 7 -> "Ví ZestStore";
            default -> "Tiền mặt";
        };
        boolean isWalletPayment = Integer.valueOf(7).equals(request.getPhuongThucThanhToan());

        if (isWalletPayment) {
            viService.truTien(user.getMaNguoiDung(), finalTotal,
                    "Thanh toán đơn hàng #" + order.getMaDonHang(), order.getMaDonHang());
        }

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

        if (Integer.valueOf(1).equals(request.getPhuongThucThanhToan()) || isWalletPayment) {
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
                            + " — tổng " + finalTotal + "₫.",
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
    public DonHang updateOrderStatus(Integer orderId, Integer status, Integer adminUserId) {
        List<Integer> validStatuses = List.of(2, 3, 4, 5, 6, 7, 8, 9);
        if (!validStatuses.contains(status)) {
            throw new BadRequestException("Invalid status: " + status);
        }
        DonHang order = getOrderById(orderId);
        Integer oldStatus = order.getTrangThaiDon();

        if (Integer.valueOf(2).equals(status) || Integer.valueOf(6).equals(status)
                || Integer.valueOf(3).equals(status) || Integer.valueOf(4).equals(status)) {
            boolean hasUnpaidOnline = thanhToanRepository.findByDonHang_MaDonHang(orderId).stream()
                    .anyMatch(t -> t.getPhuongThuc() > 1 && !Integer.valueOf(2).equals(t.getTrangThaiThanhToan()));
            if (hasUnpaidOnline) {
                throw new BadRequestException("Đơn hàng có thanh toán online chưa được thanh toán");
            }
        }

        if (Integer.valueOf(2).equals(status)) {
            boolean isCOD = thanhToanRepository.findByDonHang_MaDonHang(orderId).stream()
                    .anyMatch(t -> Integer.valueOf(1).equals(t.getPhuongThuc()));
            if (isCOD) {
                deductStockNow(orderId);
            }
        }

        if (Integer.valueOf(8).equals(status)) {
            boolean wasStockDeducted = oldStatus >= 2;
            if (wasStockDeducted) {
                restoreStock(orderId);
            }
            if (order.getPhieuGiamGia() != null && order.getPhieuGiamGia().getSoLuong() != null) {
                PhieuGiamGia coupon = order.getPhieuGiamGia();
                coupon.setSoLuong(coupon.getSoLuong() + 1);
                phieuGiamGiaRepository.save(coupon);
            }
            thanhToanRepository.findByDonHang_MaDonHang(orderId).stream()
                    .filter(t -> Integer.valueOf(2).equals(t.getTrangThaiThanhToan()))
                    .forEach(t -> {
                        t.setTrangThaiThanhToan(3);
                        thanhToanRepository.save(t);
                    });
        }

        if (Integer.valueOf(9).equals(status)) {
            boolean wasStockDeducted = oldStatus >= 2;
            if (wasStockDeducted) {
                restoreStock(orderId);
            }
            thanhToanRepository.findByDonHang_MaDonHang(orderId).stream()
                    .filter(t -> Integer.valueOf(1).equals(t.getPhuongThuc()))
                    .findFirst()
                    .ifPresent(t -> {
                        t.setTrangThaiThanhToan(3);
                        thanhToanRepository.save(t);
                    });
        }

        if (Integer.valueOf(4).equals(status) || Integer.valueOf(6).equals(status)) {
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

        if (Integer.valueOf(6).equals(status) && order.getNguoiDung() != null) {
            tichDiemChoDonHang(order);
        }

        NguoiDung admin = nguoiDungRepository.findById(adminUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User", adminUserId));
        lichSuDonHangRepository.save(LichSuDonHang.builder()
                .donHang(order)
                .trangThaiCu(oldStatus)
                .trangThaiMoi(status)
                .nguoiCapNhat(admin)
                .build());

        orderSseService.sendOrderStatusUpdate(orderId, status, oldStatus, "admin", null);

        // Notify the order's customer that its status changed (status map: 1=Chờ,2=ĐãXL,3=ĐangGiao,4=ĐãGiao,5=ĐãHủy,6=Hoàn thành,7=Trả hàng).
        if (order.getNguoiDung() != null) {
            String trangThaiText = switch (status) {
                case 2 -> "đang được xử lý";
                case 3 -> "đang được giao";
                case 4 -> "đã được giao";
                case 6 -> "đã hoàn thành";
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
    public Map<String, String> confirmReceived(Integer orderId, Integer userId) {
        DonHang order = getOrderById(orderId);
        if (!order.getNguoiDung().getMaNguoiDung().equals(userId)) {
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

        if (order.getNguoiDung() != null) {
            tichDiemChoDonHang(order);
        }

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

    @Transactional
    public Map<String, String> requestReturn(Integer orderId, Integer userId, String lyDo) {
        DonHang order = getOrderById(orderId);
        if (!order.getNguoiDung().getMaNguoiDung().equals(userId)) {
            throw new BadRequestException("Order does not belong to user");
        }
        Integer currentStatus = order.getTrangThaiDon();
        if (!Integer.valueOf(4).equals(currentStatus) && !Integer.valueOf(6).equals(currentStatus)) {
            throw new BadRequestException("Can only request return for delivered or completed orders");
        }
        if (lyDo == null || lyDo.isBlank()) {
            throw new BadRequestException("Return reason is required");
        }

        Integer oldStatus = order.getTrangThaiDon();
        order.setTrangThaiDon(7);
        donHangRepository.save(order);

        NguoiDung user = nguoiDungRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));
        lichSuDonHangRepository.save(LichSuDonHang.builder()
                .donHang(order)
                .trangThaiCu(oldStatus)
                .trangThaiMoi(7)
                .nguoiCapNhat(user)
                .ghiChu(lyDo)
                .build());

        orderSseService.sendOrderStatusUpdate(orderId, 7, oldStatus, "user", lyDo);

        // Notify admins/staff that a return has been requested.
        try {
            thongBaoService.taoThongBaoChoAdmin(
                    "Yêu cầu trả hàng #" + orderId,
                    "Khách " + user.getHoTen() + " yêu cầu trả đơn #" + orderId
                            + ". Lý do: " + lyDo + ".",
                    "YEU_CAU_TRA_HANG",
                    "/admin/returns");
        } catch (Exception ignored) {}

        return Map.of("message", "Return requested");
    }

    private BigDecimal recalculateShippingFee(OrderRequest request, List<Map<String, Object>> orderItems) {
        if (request.getToDistrictId() == null || request.getToWardCode() == null) {
            return request.getPhiVanChuyen() != null ? request.getPhiVanChuyen() : BigDecimal.ZERO;
        }

        int weight = request.getWeight() != null ? request.getWeight()
                : orderItems.stream().mapToInt(item -> ((Integer) item.get("soLuong")) * 500).sum();
        weight = Math.max(weight, 500);

        Map<String, Object> result = ghnService.calculateFee(2, request.getToDistrictId(), request.getToWardCode(), weight);
        if (result.containsKey("error")) {
            throw new BadRequestException("Không thể tính phí vận chuyển, vui lòng thử lại sau");
        }

        Object data = result.get("data");
        if (data instanceof Map) {
            Object total = ((Map<?, ?>) data).get("total");
            if (total instanceof Number) {
                return BigDecimal.valueOf(((Number) total).longValue());
            }
        }
        throw new BadRequestException("GHN trả về dữ liệu phí vận chuyển không hợp lệ");
    }

    private void deductStockNow(Integer orderId) {
        List<MucDonHang> items = mucDonHangRepository.findByDonHang_MaDonHang(orderId);
        for (MucDonHang item : items) {
            BienTheSanPham variant = bienTheRepository.findByIdForUpdate(item.getBienThe().getMaBienThe())
                    .orElseThrow(() -> new ResourceNotFoundException("Variant", item.getBienThe().getMaBienThe()));
            if (variant.getTonKho() < item.getSoLuong()) {
                throw new BadRequestException("Insufficient stock for " + variant.getSku()
                        + " (available: " + variant.getTonKho() + ", needed: " + item.getSoLuong() + ")");
            }
            variant.setTonKho(variant.getTonKho() - item.getSoLuong());
            bienTheRepository.save(variant);
        }
    }

    private boolean wasStockDeductedForOrder(DonHang order) {
        if (order.getTrangThaiDon() < 2) return false;
        return thanhToanRepository.findByDonHang_MaDonHang(order.getMaDonHang()).stream()
                .anyMatch(t -> Integer.valueOf(1).equals(t.getPhuongThuc())
                        ? order.getTrangThaiDon() >= 2
                        : Integer.valueOf(2).equals(t.getTrangThaiThanhToan()));
    }

    private void restoreStock(Integer orderId) {
        List<MucDonHang> items = mucDonHangRepository.findByDonHang_MaDonHang(orderId);
        for (MucDonHang item : items) {
            BienTheSanPham variant = bienTheRepository.findByIdForUpdate(item.getBienThe().getMaBienThe())
                    .orElseThrow(() -> new ResourceNotFoundException("Variant", item.getBienThe().getMaBienThe()));
            variant.setTonKho(variant.getTonKho() + item.getSoLuong());
            bienTheRepository.save(variant);
        }
    }

    @Transactional
    public Map<String, String> cancelOrder(Integer orderId, Integer userId) {
        DonHang order = getOrderById(orderId);
        if (!order.getNguoiDung().getMaNguoiDung().equals(userId)) {
            throw new BadRequestException("Order does not belong to user");
        }
        Integer stt = order.getTrangThaiDon();
        if (!Integer.valueOf(1).equals(stt) && !Integer.valueOf(2).equals(stt) && !Integer.valueOf(3).equals(stt)) {
            throw new BadRequestException("Chỉ có thể hủy đơn ở trạng thái chờ xác nhận, đã xác nhận hoặc chờ giao hàng");
        }

        if (wasStockDeductedForOrder(order)) {
            List<MucDonHang> items = mucDonHangRepository.findByDonHang_MaDonHang(orderId);
            for (MucDonHang item : items) {
                BienTheSanPham variant = bienTheRepository.findByIdForUpdate(item.getBienThe().getMaBienThe())
                        .orElseThrow(() -> new ResourceNotFoundException("Variant", item.getBienThe().getMaBienThe()));
                variant.setTonKho(variant.getTonKho() + item.getSoLuong());
                bienTheRepository.save(variant);
            }
        }

        if (order.getPhieuGiamGia() != null) {
            phieuGiamGiaService.restoreCoupon(order.getPhieuGiamGia());
        }

        BigDecimal refundAmount = BigDecimal.ZERO;
        List<ThanhToan> payments = thanhToanRepository.findByDonHang_MaDonHang(orderId);
        for (ThanhToan payment : payments) {
            if (Integer.valueOf(2).equals(payment.getTrangThaiThanhToan())
                    && !Integer.valueOf(1).equals(payment.getPhuongThuc())) {
                refundAmount = refundAmount.add(payment.getSoTien());
                payment.setTrangThaiThanhToan(3);
                thanhToanRepository.save(payment);
            }
        }
        if (refundAmount.compareTo(BigDecimal.ZERO) > 0) {
            viService.napTien(userId, refundAmount,
                    "Hoàn tiền hủy đơn #" + order.getMaDonHang(), orderId);
        }

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

    private void tichDiemChoDonHang(DonHang order) {
        BigDecimal base = order.getTongTien();
        if (diemService.tichTienTrenTienMat() && order.getSoTienGiamDiem() != null) {
            base = base.subtract(order.getSoTienGiamDiem()).max(BigDecimal.ZERO);
        }
        diemService.tichDiem(order.getNguoiDung().getMaNguoiDung(), order.getMaDonHang(), base, "ONLINE");
    }
}