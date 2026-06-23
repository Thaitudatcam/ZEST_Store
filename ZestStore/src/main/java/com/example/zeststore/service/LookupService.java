package com.example.zeststore.service;

import com.example.zeststore.repository.KichCoRepository;
import com.example.zeststore.repository.MauSacRepository;
import com.example.zeststore.repository.ThuongHieuRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class LookupService {

    private final ThuongHieuRepository thuongHieuRepository;
    private final KichCoRepository kichCoRepository;
    private final MauSacRepository mauSacRepository;

    public Object getBrands() {
        return thuongHieuRepository.findAll();
    }

    public Object getSizes() {
        return kichCoRepository.findAll();
    }

    public Object getColors() {
        return mauSacRepository.findAll();
    }
}
