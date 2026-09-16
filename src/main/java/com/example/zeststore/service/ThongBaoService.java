package com.example.zeststore.service;

import com.example.zeststore.entity.NguoiDung;
import com.example.zeststore.entity.ThongBao;
import com.example.zeststore.repository.NguoiDungRepository;
import com.example.zeststore.repository.ThongBaoRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

/**
 * CRUD + broadcast for user notifications ({@link ThongBao}).
 * Combines persistence with SSE push via {@link NotificationSseService}.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ThongBaoService {

    private final ThongBaoRepository thongBaoRepository;
    private final NguoiDungRepository nguoiDungRepository;
    private final NotificationSseService notificationSseService;

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getByUser(Integer maNguoiDung) {
        return thongBaoRepository
                .findByNguoiDung_MaNguoiDungOrderByNgayTaoDesc(maNguoiDung)
                .stream()
                .map(this::toMap)
                .toList();
    }

    @Transactional(readOnly = true)
    public Map<String, Object> countUnread(Integer maNguoiDung) {
        long count = thongBaoRepository.countByNguoiDung_MaNguoiDungAndDaDocFalse(maNguoiDung);
        return Map.of("count", count);
    }

    @Transactional
    public void markAsRead(Integer maThongBao, Integer maNguoiDung) {
        thongBaoRepository.findById(maThongBao).ifPresent(t -> {
            if (t.getNguoiDung() != null
                    && t.getNguoiDung().getMaNguoiDung().equals(maNguoiDung)
                    && Boolean.FALSE.equals(t.getDaDoc())) {
                t.setDaDoc(true);
                thongBaoRepository.save(t);
            }
        });
    }

    @Transactional
    public int markAllRead(Integer maNguoiDung) {
        return thongBaoRepository.markAllRead(maNguoiDung);
    }

    @Transactional
    public int deleteAll(Integer maNguoiDung) {
        return thongBaoRepository.deleteAllByUser(maNguoiDung);
    }

    /**
     * Create a notification for a single user and push it live over SSE.
     * Runs in its own transaction so a notification failure never marks the
     * caller's business transaction as rollback-only.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void taoThongBao(Integer maNguoiDung, String tieuDe, String noiDung, String loai, String lienKet) {
        nguoiDungRepository.findById(maNguoiDung).ifPresentOrElse(
                nguoiDung -> persistAndPush(nguoiDung, tieuDe, noiDung, loai, lienKet),
                () -> log.warn("taoThongBao: user {} not found", maNguoiDung));
    }

    /**
     * Fan-out the same notification to every active ADMIN/STAFF user.
     * Useful for events that staff should see (new order, return request, ...).
     * Runs in its own transaction (see {@link #taoThongBao}).
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void taoThongBaoChoAdmin(String tieuDe, String noiDung, String loai, String lienKet) {
        List<NguoiDung> recipients =
                nguoiDungRepository.findByVaiTro_TenVaiTroInAndTrangThai(List.of("ADMIN", "STAFF"), 1);
        for (NguoiDung nd : recipients) {
            persistAndPush(nd, tieuDe, noiDung, loai, lienKet);
        }
    }

    private void persistAndPush(NguoiDung nguoiDung, String tieuDe, String noiDung, String loai, String lienKet) {
        ThongBao t = ThongBao.builder()
                .nguoiDung(nguoiDung)
                .tieuDe(tieuDe)
                .noiDung(noiDung)
                .loai(loai)
                .lienKet(lienKet)
                .build();
        ThongBao saved = thongBaoRepository.save(t);

        Map<String, Object> payload = toMap(saved);
        try {
            notificationSseService.sendNotification(nguoiDung.getMaNguoiDung(), payload);
        } catch (Exception e) {
            log.warn("SSE push failed for user {}: {}", nguoiDung.getMaNguoiDung(), e.getMessage());
        }
    }

    private Map<String, Object> toMap(ThongBao t) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("maThongBao", t.getMaThongBao());
        m.put("tieuDe", t.getTieuDe());
        m.put("noiDung", t.getNoiDung());
        m.put("loai", t.getLoai());
        m.put("daDoc", Boolean.TRUE.equals(t.getDaDoc()));
        m.put("lienKet", t.getLienKet());
        m.put("ngayTao", t.getNgayTao() != null ? t.getNgayTao().toString() : LocalDateTime.now().toString());
        return m;
    }
}
