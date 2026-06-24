package com.example.zeststore.service;

import com.example.zeststore.entity.NguoiDung;
import com.example.zeststore.entity.VaiTro;
import com.example.zeststore.repository.NguoiDungRepository;
import com.example.zeststore.repository.VaiTroRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
                    m.put("ngayTao", u.getNgayTao());
                    return m;
                }).collect(Collectors.toList());
    }

    @Transactional
    public Map<String, Object> createEmployee(Map<String, String> body) {
        if (nguoiDungRepository.existsByEmail(body.get("email"))) {
            throw new RuntimeException("Email already exists");
        }

        VaiTro role = vaiTroRepository.findByTenVaiTro(body.get("vaiTro"))
                .orElseThrow(() -> new RuntimeException("Role not found: " + body.get("vaiTro")));

        NguoiDung emp = NguoiDung.builder()
                .hoTen(body.get("hoTen"))
                .email(body.get("email"))
                .soDienThoai(body.get("soDienThoai"))
                .matKhauMaHoa(passwordEncoder.encode(body.get("matKhau")))
                .vaiTro(role)
                .trangThai(1)
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
    public void updateEmployee(Integer id, Map<String, String> body) {
        NguoiDung emp = nguoiDungRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Employee not found: " + id));

        if (body.containsKey("hoTen")) emp.setHoTen(body.get("hoTen"));
        if (body.containsKey("soDienThoai")) emp.setSoDienThoai(body.get("soDienThoai"));
        if (body.containsKey("vaiTro")) {
            VaiTro role = vaiTroRepository.findByTenVaiTro(body.get("vaiTro"))
                    .orElseThrow(() -> new RuntimeException("Role not found: " + body.get("vaiTro")));
            emp.setVaiTro(role);
        }
        if (body.containsKey("matKhau") && !body.get("matKhau").isEmpty()) {
            emp.setMatKhauMaHoa(passwordEncoder.encode(body.get("matKhau")));
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
}
