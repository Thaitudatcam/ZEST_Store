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
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

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

    @Transactional
    public NguoiDung updateProfile(Integer userId, UserUpdateRequest request) {
        NguoiDung user = getUserById(userId);
        if (request.getHoTen() != null) user.setHoTen(request.getHoTen());
        if (request.getSoDienThoai() != null) user.setSoDienThoai(request.getSoDienThoai());
        if (request.getAnhDaiDien() != null) user.setAnhDaiDien(request.getAnhDaiDien());
        if (request.getGioiTinh() != null) user.setGioiTinh(request.getGioiTinh());
        if (request.getNgaySinh() != null) user.setNgaySinh(request.getNgaySinh());
        return nguoiDungRepository.save(user);
    }

    @Transactional
    public void changePassword(Integer userId, ChangePasswordRequest request) {
        NguoiDung user = getUserById(userId);
        if (!passwordEncoder.matches(request.getMatKhauCu(), user.getMatKhauMaHoa())) {
            throw new BadRequestException("Current password is incorrect");
        }
        user.setMatKhauMaHoa(passwordEncoder.encode(request.getMatKhauMoi()));
        nguoiDungRepository.save(user);
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
                .chiTietDiaChi(request.getChiTietDiaChi())
                .laMacDinh(Boolean.TRUE.equals(request.getLaMacDinh()))
                .build());
    }

    @Transactional
    public DiaChiNguoiDung updateAddress(Integer addressId, DiaChiRequest request) {
        DiaChiNguoiDung address = diaChiRepository.findById(addressId)
                .orElseThrow(() -> new ResourceNotFoundException("Address", addressId));
        address.setTenNguoiNhan(request.getTenNguoiNhan());
        address.setSoDienThoai(request.getSoDienThoai());
        address.setChiTietDiaChi(request.getChiTietDiaChi());
        if (Boolean.TRUE.equals(request.getLaMacDinh())) {
            diaChiRepository.resetMacDinhByNguoiDungId(address.getNguoiDung().getMaNguoiDung());
            address.setLaMacDinh(true);
        }
        return diaChiRepository.save(address);
    }

    @Transactional
    public void deleteAddress(Integer addressId) {
        DiaChiNguoiDung address = diaChiRepository.findById(addressId)
                .orElseThrow(() -> new ResourceNotFoundException("Address", addressId));
        address.setNgayXoa(java.time.LocalDateTime.now());
        diaChiRepository.save(address);
    }

    @Transactional
    public void setDefaultAddress(Integer userId, Integer addressId) {
        DiaChiNguoiDung address = diaChiRepository.findById(addressId)
                .orElseThrow(() -> new ResourceNotFoundException("Address", addressId));
        if (!address.getNguoiDung().getMaNguoiDung().equals(userId)) {
            throw new BadRequestException("Address does not belong to user");
        }
        diaChiRepository.resetMacDinhByNguoiDungId(userId);
        address.setLaMacDinh(true);
        diaChiRepository.save(address);
    }
}
