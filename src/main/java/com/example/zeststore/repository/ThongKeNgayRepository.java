package com.example.zeststore.repository;

import com.example.zeststore.entity.ThongKeNgay;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface ThongKeNgayRepository extends JpaRepository<ThongKeNgay, LocalDate> {

    List<ThongKeNgay> findByNgayBetween(LocalDate tuNgay, LocalDate denNgay);

    void deleteByNgayBetween(LocalDate tuNgay, LocalDate denNgay);
}
