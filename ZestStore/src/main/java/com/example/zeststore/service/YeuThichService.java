package com.example.zeststore.service;

import com.example.zeststore.entity.*;
import com.example.zeststore.exception.BadRequestException;
import com.example.zeststore.exception.ResourceNotFoundException;
import com.example.zeststore.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class YeuThichService {

    private final DanhSachYeuThichRepository danhSachYeuThichRepository;
    private final MucYeuThichRepository mucYeuThichRepository;
    private final SanPhamRepository sanPhamRepository;
    private final NguoiDungRepository nguoiDungRepository;

    public DanhSachYeuThich getOrCreateWishlist(Integer userId) {
        return danhSachYeuThichRepository.findByNguoiDung_MaNguoiDung(userId)
                .orElseGet(() -> {
                    NguoiDung user = nguoiDungRepository.findById(userId)
                            .orElseThrow(() -> new ResourceNotFoundException("User", userId));
                    return danhSachYeuThichRepository.save(
                            DanhSachYeuThich.builder().nguoiDung(user).build());
                });
    }

    public List<MucYeuThich> getWishlistItems(Integer userId) {
        DanhSachYeuThich wishlist = getOrCreateWishlist(userId);
        return mucYeuThichRepository.findByDanhSachYeuThich_MaDsYeuThich(wishlist.getMaDsYeuThich());
    }

    public boolean isInWishlist(Integer userId, Integer productId) {
        return mucYeuThichRepository
                .existsByDanhSachYeuThich_NguoiDung_MaNguoiDungAndSanPham_MaSanPham(userId, productId);
    }

    @Transactional
    public MucYeuThich addItem(Integer userId, Integer productId) {
        DanhSachYeuThich wishlist = getOrCreateWishlist(userId);
        SanPham product = sanPhamRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product", productId));

        if (mucYeuThichRepository.existsByDanhSachYeuThich_NguoiDung_MaNguoiDungAndSanPham_MaSanPham(
                userId, productId)) {
            throw new BadRequestException("Product already in wishlist");
        }

        return mucYeuThichRepository.save(MucYeuThich.builder()
                .danhSachYeuThich(wishlist)
                .sanPham(product)
                .build());
    }

    @Transactional
    public void removeItem(Integer userId, Integer productId) {
        DanhSachYeuThich wishlist = getOrCreateWishlist(userId);
        MucYeuThich item = mucYeuThichRepository
                .findByDanhSachYeuThich_MaDsYeuThichAndSanPham_MaSanPham(
                        wishlist.getMaDsYeuThich(), productId)
                .orElseThrow(() -> new ResourceNotFoundException("Wishlist item not found"));
        mucYeuThichRepository.delete(item);
    }
}
