package com.example.zeststore.service;

import com.example.zeststore.entity.NguoiDung;
import com.example.zeststore.repository.NguoiDungRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminCustomerService {

    private final NguoiDungRepository nguoiDungRepository;

    public List<Map<String, Object>> getAllCustomers() {
        return nguoiDungRepository.findAll().stream()
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

    @Transactional
    public Map<String, Object> toggleStatus(Integer id) {
        NguoiDung u = nguoiDungRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Customer not found: " + id));
        u.setTrangThai(u.getTrangThai() == 1 ? 0 : 1);
        nguoiDungRepository.save(u);
        return Map.of("message", "Status updated", "trangThai", u.getTrangThai());
    }
}
