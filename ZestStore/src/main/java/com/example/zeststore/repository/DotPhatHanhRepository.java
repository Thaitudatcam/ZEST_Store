package com.example.zeststore.repository;

import com.example.zeststore.entity.DotPhatHanh;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DotPhatHanhRepository extends JpaRepository<DotPhatHanh, Integer> {
}
