package com.example.zeststore.service;

import com.example.zeststore.entity.NguoiDung;
import com.example.zeststore.entity.VaiTro;
import com.example.zeststore.repository.NguoiDungRepository;
import com.example.zeststore.repository.VaiTroRepository;
import com.example.zeststore.repository.DiaChiNguoiDungRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminCustomerService {

    private final NguoiDungRepository nguoiDungRepository;
    private final VaiTroRepository vaiTroRepository;
    private final PasswordEncoder passwordEncoder;
    private final DiaChiNguoiDungRepository diaChiNguoiDungRepository;

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getAllCustomers() {
        return nguoiDungRepository.findAll().stream()
                .filter(u -> u.getNgayXoa() == null)
                .filter(u -> u.getVaiTro() != null && "CUSTOMER".equals(u.getVaiTro().getTenVaiTro()))
                .map(u -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("maNguoiDung", u.getMaNguoiDung());
                    m.put("hoTen", u.getHoTen());
                    m.put("email", u.getEmail());
                    m.put("soDienThoai", u.getSoDienThoai());
                    m.put("trangThai", u.getTrangThai());
                    m.put("ngayTao", u.getNgayTao());
                    m.put("gioiTinh", u.getGioiTinh());
                    m.put("ngaySinh", u.getNgaySinh());
                    return m;
                }).collect(Collectors.toList());
    }

    public Map<String, Object> getCustomerDetail(Integer id) {
        NguoiDung u = nguoiDungRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Customer not found: " + id));
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("maNguoiDung", u.getMaNguoiDung());
        m.put("hoTen", u.getHoTen());
        m.put("email", u.getEmail());
        m.put("soDienThoai", u.getSoDienThoai());
        m.put("trangThai", u.getTrangThai());
        m.put("ngayTao", u.getNgayTao());
        m.put("gioiTinh", u.getGioiTinh());
        m.put("ngaySinh", u.getNgaySinh());
        m.put("anhDaiDien", u.getAnhDaiDien());
        m.put("ngayDangNhapCuoi", u.getNgayDangNhapCuoi());
        return m;
    }

    public List<Map<String, Object>> getCustomerAddresses(Integer userId) {
        return diaChiNguoiDungRepository.findByNguoiDung_MaNguoiDung(userId).stream()
                .filter(d -> d.getNgayXoa() == null)
                .map(d -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("maDiaChi", d.getMaDiaChi());
                    m.put("tenNguoiNhan", d.getTenNguoiNhan());
                    m.put("soDienThoai", d.getSoDienThoai());
                    m.put("tinhThanhPho", d.getTinhThanhPho());
                    m.put("quanHuyen", d.getQuanHuyen());
                    m.put("phuongXa", d.getPhuongXa());
                    m.put("provinceId", d.getProvinceId());
                    m.put("districtId", d.getDistrictId());
                    m.put("wardCode", d.getWardCode());
                    m.put("chiTietDiaChi", d.getChiTietDiaChi());
                    m.put("laMacDinh", d.getLaMacDinh());
                    return m;
                }).collect(Collectors.toList());
    }

    public List<Map<String, Object>> searchCustomers(String q) {
        if (q == null || q.trim().isEmpty()) return List.of();
        return nguoiDungRepository.searchCustomers(q.trim()).stream().map(u -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("maNguoiDung", u.getMaNguoiDung());
            m.put("hoTen", u.getHoTen());
            m.put("email", u.getEmail());
            m.put("soDienThoai", u.getSoDienThoai());
            return m;
        }).collect(Collectors.toList());
    }

    @Transactional
    public Map<String, Object> createCustomer(Map<String, String> body) {
        if (body.get("hoTen") == null || body.get("hoTen").trim().isEmpty()) {
            throw new RuntimeException("Họ tên không được để trống");
        }
        String email = body.get("email");
        if (email == null || email.trim().isEmpty()) {
            email = "khach" + System.currentTimeMillis() + "@zeststore.com";
        }
        if (nguoiDungRepository.existsByEmail(email)) {
            throw new RuntimeException("Email đã tồn tại");
        }
        String sdt = body.get("soDienThoai");
        if (sdt != null && !sdt.trim().isEmpty() && nguoiDungRepository.existsBySoDienThoai(sdt.trim())) {
            throw new RuntimeException("Số điện thoại đã tồn tại");
        }

        VaiTro role = vaiTroRepository.findByTenVaiTro("CUSTOMER")
                .orElseThrow(() -> new RuntimeException("Role CUSTOMER not found"));

        String nguonTao = body.get("nguonTao");
        if (nguonTao == null || nguonTao.trim().isEmpty()) {
            nguonTao = "SELF_REGISTER";
        }

        NguoiDung customer = NguoiDung.builder()
                .hoTen(body.get("hoTen").trim())
                .email(email.trim())
                .soDienThoai(sdt != null ? sdt.trim() : null)
                .matKhauMaHoa(passwordEncoder.encode(
                        body.get("matKhau") != null && !body.get("matKhau").trim().isEmpty()
                                ? body.get("matKhau").trim() : "customer123"))
                .vaiTro(role)
                .trangThai(1)
                .nguonTao(nguonTao.trim())
                .build();
        customer = nguoiDungRepository.save(customer);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("maNguoiDung", customer.getMaNguoiDung());
        result.put("hoTen", customer.getHoTen());
        result.put("email", customer.getEmail());
        result.put("soDienThoai", customer.getSoDienThoai());
        result.put("message", "Tạo khách hàng thành công");
        return result;
    }

    @Transactional
    public Map<String, Object> toggleStatus(Integer id) {
        NguoiDung u = nguoiDungRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Customer not found: " + id));
        u.setTrangThai(u.getTrangThai() == 1 ? 0 : 1);
        nguoiDungRepository.save(u);
        return Map.of("message", "Status updated", "trangThai", u.getTrangThai());
    }

    @Transactional
    public Map<String, Object> bulkDeleteCustomers(List<Integer> ids) {
        int count = 0;
        for (Integer id : ids) {
            NguoiDung u = nguoiDungRepository.findById(id).orElse(null);
            if (u != null && u.getNgayXoa() == null
                    && u.getVaiTro() != null && "CUSTOMER".equals(u.getVaiTro().getTenVaiTro())) {
                u.setNgayXoa(LocalDateTime.now());
                u.setTrangThai(0);
                nguoiDungRepository.save(u);
                count++;
            }
        }
        return Map.of("deletedCount", count);
    }
}
