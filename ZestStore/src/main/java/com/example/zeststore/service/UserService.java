package com.example.zeststore.service;

import com.example.zeststore.dto.request.ChangePasswordRequest;
import com.example.zeststore.dto.request.DiaChiRequest;
import com.example.zeststore.dto.request.UserUpdateRequest;
import com.example.zeststore.entity.DiaChiNguoiDung;
import com.example.zeststore.entity.NguoiDung;
import com.example.zeststore.exception.BadRequestException;
import com.example.zeststore.exception.ResourceNotFoundException;
import com.example.zeststore.repository.DiaChiNguoiDungRepository;
import com.example.zeststore.repository.NguoiDungRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class UserService {

    private final NguoiDungRepository nguoiDungRepository;
    private final DiaChiNguoiDungRepository diaChiRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional(readOnly = true)
    public NguoiDung getUserById(Integer id) {
        return nguoiDungRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", id));
    }

    @Transactional(readOnly = true)
    public NguoiDung getUserByEmail(String email) {
        return nguoiDungRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));
    }

    public Integer getUserIdFromAuth(Authentication auth) {
        return getUserByEmail(auth.getName()).getMaNguoiDung();
    }

    public Map<String, Object> getProfileData(Integer userId) {
        NguoiDung user = getUserById(userId);
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("maNguoiDung", user.getMaNguoiDung());
        result.put("hoTen", user.getHoTen());
        result.put("email", user.getEmail());
        result.put("soDienThoai", user.getSoDienThoai());
        result.put("anhDaiDien", user.getAnhDaiDien());
        result.put("gioiTinh", user.getGioiTinh());
        result.put("ngaySinh", user.getNgaySinh() != null ? user.getNgaySinh().toString() : null);
        result.put("vaiTro", user.getVaiTro() != null ? user.getVaiTro().getTenVaiTro() : null);
        return result;
    }

    @Transactional
    public Map<String, Object> updateProfile(Integer userId, UserUpdateRequest request) {
        NguoiDung user = getUserById(userId);
        if (request.getHoTen() != null) user.setHoTen(request.getHoTen());
        if (request.getSoDienThoai() != null) user.setSoDienThoai(request.getSoDienThoai());
        if (request.getAnhDaiDien() != null) user.setAnhDaiDien(request.getAnhDaiDien());
        if (request.getGioiTinh() != null) user.setGioiTinh(request.getGioiTinh());
        if (request.getNgaySinh() != null) user.setNgaySinh(request.getNgaySinh());
        NguoiDung saved = nguoiDungRepository.save(user);
        return Map.of("message", "Profile updated", "user", saved);
    }

    @Transactional
    public Map<String, String> changePassword(Integer userId, ChangePasswordRequest request) {
        NguoiDung user = getUserById(userId);
        if (!passwordEncoder.matches(request.getMatKhauCu(), user.getMatKhauMaHoa())) {
            throw new BadRequestException("Current password is incorrect");
        }
        user.setMatKhauMaHoa(passwordEncoder.encode(request.getMatKhauMoi()));
        nguoiDungRepository.save(user);
        return Map.of("message", "Password changed successfully");
    }

    public List<DiaChiNguoiDung> getAddresses(Integer userId) {
        return diaChiRepository.findByNguoiDung_MaNguoiDung(userId);
    }

    @Transactional
    public DiaChiNguoiDung addAddress(Integer userId, DiaChiRequest request) {
        NguoiDung user = getUserById(userId);
        if (Boolean.TRUE.equals(request.getLaMacDinh())) {
            diaChiRepository.resetMacDinhByNguoiDungId(userId);
        }
        return diaChiRepository.save(DiaChiNguoiDung.builder()
                .nguoiDung(user)
                .tenNguoiNhan(request.getTenNguoiNhan())
                .soDienThoai(request.getSoDienThoai())
                .tinhThanhPho(request.getTinhThanhPho())
                .quanHuyen(request.getQuanHuyen())
                .phuongXa(request.getPhuongXa())
                .provinceId(request.getProvinceId())
                .districtId(request.getDistrictId())
                .wardCode(request.getWardCode())
                .chiTietDiaChi(request.getChiTietDiaChi())
                .laMacDinh(Boolean.TRUE.equals(request.getLaMacDinh()))
                .build());
    }

    @Transactional
    public DiaChiNguoiDung updateAddress(Integer userId, Integer addressId, DiaChiRequest request) {
        DiaChiNguoiDung address = diaChiRepository.findById(addressId)
                .orElseThrow(() -> new ResourceNotFoundException("Address", addressId));
        if (!address.getNguoiDung().getMaNguoiDung().equals(userId)) {
            throw new BadRequestException("Address does not belong to user");
        }
        address.setTenNguoiNhan(request.getTenNguoiNhan());
        address.setSoDienThoai(request.getSoDienThoai());
        address.setTinhThanhPho(request.getTinhThanhPho());
        address.setQuanHuyen(request.getQuanHuyen());
        address.setPhuongXa(request.getPhuongXa());
        address.setProvinceId(request.getProvinceId());
        address.setDistrictId(request.getDistrictId());
        address.setWardCode(request.getWardCode());
        address.setChiTietDiaChi(request.getChiTietDiaChi());
        if (Boolean.TRUE.equals(request.getLaMacDinh())) {
            diaChiRepository.resetMacDinhByNguoiDungId(userId);
            address.setLaMacDinh(true);
        }
        return diaChiRepository.save(address);
    }

    @Transactional
    public Map<String, String> deleteAddress(Integer userId, Integer addressId) {
        DiaChiNguoiDung address = diaChiRepository.findById(addressId)
                .orElseThrow(() -> new ResourceNotFoundException("Address", addressId));
        if (!address.getNguoiDung().getMaNguoiDung().equals(userId)) {
            throw new BadRequestException("Address does not belong to user");
        }
        address.setNgayXoa(java.time.LocalDateTime.now());
        diaChiRepository.save(address);
        return Map.of("message", "Address deleted");
    }

    @Transactional
    public void updateAvatar(Integer userId, String url) {
        NguoiDung user = getUserById(userId);
        user.setAnhDaiDien(url);
        nguoiDungRepository.save(user);
    }

    @Transactional
    public Map<String, String> setDefaultAddress(Integer userId, Integer addressId) {
        DiaChiNguoiDung address = diaChiRepository.findById(addressId)
                .orElseThrow(() -> new ResourceNotFoundException("Address", addressId));
        if (!address.getNguoiDung().getMaNguoiDung().equals(userId)) {
            throw new BadRequestException("Address does not belong to user");
        }
        diaChiRepository.resetMacDinhByNguoiDungId(userId);
        address.setLaMacDinh(true);
        diaChiRepository.save(address);
        return Map.of("message", "Default address updated");
    }
}
