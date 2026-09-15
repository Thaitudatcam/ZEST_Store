package com.example.zeststore.service;

import com.example.zeststore.entity.NguoiDung;
import com.example.zeststore.entity.VaiTro;
import com.example.zeststore.exception.BadRequestException;
import com.example.zeststore.exception.ResourceNotFoundException;
import com.example.zeststore.repository.NguoiDungRepository;
import com.example.zeststore.repository.VaiTroRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminEmployeeService {

    private final NguoiDungRepository nguoiDungRepository;
    private final VaiTroRepository vaiTroRepository;
    private final PasswordEncoder passwordEncoder;

    public List<Map<String, Object>> getAllEmployees() {
        return nguoiDungRepository.findAll().stream()
                .filter(u -> u.getVaiTro() != null &&
                        ("ADMIN".equals(u.getVaiTro().getTenVaiTro()) || "STAFF".equals(u.getVaiTro().getTenVaiTro())))
                .map(u -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("maNguoiDung", u.getMaNguoiDung());
                    m.put("hoTen", u.getHoTen());
                    m.put("email", u.getEmail());
                    m.put("soDienThoai", u.getSoDienThoai());
                    m.put("trangThai", u.getTrangThai());
                    m.put("vaiTro", u.getVaiTro().getTenVaiTro());
                    m.put("choPhepBanHang", u.getChoPhepBanHang());
                    m.put("ngayTao", u.getNgayTao());
                    return m;
                }).collect(Collectors.toList());
    }

    @Transactional
    public Map<String, Object> createEmployee(Map<String, Object> body) {
        String email = (String) body.get("email");
        String vaiTro = (String) body.get("vaiTro");

        if (nguoiDungRepository.existsByEmail(email)) {
            throw new RuntimeException("Email already exists");
        }

        VaiTro role = vaiTroRepository.findByTenVaiTro(vaiTro)
                .orElseGet(() -> vaiTroRepository.save(VaiTro.builder().tenVaiTro(vaiTro).build()));

        Boolean choPhepBanHang = body.get("choPhepBanHang") != null
                ? Boolean.parseBoolean(body.get("choPhepBanHang").toString()) : false;

        String sdt = (String) body.get("soDienThoai");
        if (sdt != null && sdt.trim().isEmpty()) sdt = null;

        Boolean gioiTinh = body.get("gioiTinh") != null
                ? Boolean.parseBoolean(body.get("gioiTinh").toString()) : null;

        LocalDate ngaySinh = null;
        if (body.get("ngaySinh") != null && !body.get("ngaySinh").toString().isEmpty()) {
            try { ngaySinh = LocalDate.parse(body.get("ngaySinh").toString()); } catch (Exception ignored) {}
        }

        String diaChi = (String) body.get("diaChi");
        if (diaChi != null && diaChi.trim().isEmpty()) diaChi = null;

        NguoiDung emp = NguoiDung.builder()
                .maNguoiDungCode("EMP" + System.currentTimeMillis())
                .hoTen((String) body.get("hoTen"))
                .email((String) body.get("email"))
                .soDienThoai(sdt)
                .matKhauMaHoa(passwordEncoder.encode((String) body.get("matKhau")))
                .vaiTro(role)
                .trangThai(1)
                .choPhepBanHang(choPhepBanHang)
                .gioiTinh(gioiTinh)
                .ngaySinh(ngaySinh)
                .build();
        emp = nguoiDungRepository.save(emp);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("maNguoiDung", emp.getMaNguoiDung());
        result.put("hoTen", emp.getHoTen());
        result.put("email", emp.getEmail());
        result.put("message", "Employee created successfully");
        return result;
    }

    @Transactional
    public void updateEmployee(Integer id, Map<String, Object> body) {
        NguoiDung emp = nguoiDungRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Employee not found: " + id));

        if (body.containsKey("hoTen")) emp.setHoTen((String) body.get("hoTen"));
        if (body.containsKey("soDienThoai")) { String s = (String) body.get("soDienThoai"); emp.setSoDienThoai(s != null && s.trim().isEmpty() ? null : s); }
        if (body.containsKey("vaiTro")) {
            VaiTro role = vaiTroRepository.findByTenVaiTro((String) body.get("vaiTro"))
                    .orElseGet(() -> vaiTroRepository.save(VaiTro.builder().tenVaiTro((String) body.get("vaiTro")).build()));
            emp.setVaiTro(role);
        }
        if (body.containsKey("matKhau") && body.get("matKhau") != null && !((String) body.get("matKhau")).isEmpty()) {
            emp.setMatKhauMaHoa(passwordEncoder.encode((String) body.get("matKhau")));
        }
        if (body.containsKey("choPhepBanHang")) {
            emp.setChoPhepBanHang(Boolean.parseBoolean(body.get("choPhepBanHang").toString()));
        }
        nguoiDungRepository.save(emp);
    }

    @Transactional
    public Map<String, Object> toggleStatus(Integer id) {
        NguoiDung emp = nguoiDungRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Employee not found: " + id));
        emp.setTrangThai(emp.getTrangThai() == 1 ? 0 : 1);
        nguoiDungRepository.save(emp);
        return Map.of("message", "Status updated", "trangThai", emp.getTrangThai());
    }

    @Transactional
    public Map<String, Object> convertToEmployee(Map<String, Object> body) {
        if (body.get("maNguoiDung") == null) {
            throw new BadRequestException("maNguoiDung is required");
        }
        Integer maNguoiDung = Integer.valueOf(body.get("maNguoiDung").toString());
        String vaiTroStr = (String) body.get("vaiTro");
        if (vaiTroStr == null || vaiTroStr.isBlank()) {
            throw new BadRequestException("vaiTro is required");
        }
        Boolean choPhepBanHang = body.get("choPhepBanHang") != null
                ? Boolean.parseBoolean(body.get("choPhepBanHang").toString()) : false;

        NguoiDung user = nguoiDungRepository.findById(maNguoiDung)
                .orElseThrow(() -> new ResourceNotFoundException("User", maNguoiDung));

        if (user.getVaiTro() != null && !"CUSTOMER".equals(user.getVaiTro().getTenVaiTro())) {
            throw new BadRequestException("User is already an employee");
        }

        VaiTro role = vaiTroRepository.findByTenVaiTro(vaiTroStr)
                .orElseGet(() -> vaiTroRepository.save(VaiTro.builder().tenVaiTro(vaiTroStr).build()));

        user.setVaiTro(role);
        user.setChoPhepBanHang(choPhepBanHang);
        nguoiDungRepository.save(user);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("maNguoiDung", user.getMaNguoiDung());
        result.put("hoTen", user.getHoTen());
        result.put("email", user.getEmail());
        result.put("message", "Converted to employee successfully");
        return result;
    }
}
