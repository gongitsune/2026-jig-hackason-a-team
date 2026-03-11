package com.example.app.service;

import java.util.Optional;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import com.example.app.dao.RoundWinnerImageDao;

@Service
public class RoundCompletionService {

    private final JdbcTemplate jdbcTemplate;
    private final RoundWinnerImageDao roundWinnerImageDao;
    private final OpenAIImageService openAIImageService;

    public RoundCompletionService(
            JdbcTemplate jdbcTemplate,
            RoundWinnerImageDao roundWinnerImageDao,
            OpenAIImageService openAIImageService
    ) {
        this.jdbcTemplate = jdbcTemplate;
        this.roundWinnerImageDao = roundWinnerImageDao;
        this.openAIImageService = openAIImageService;
    }

    /**
     * ラウンド完了時に1位の文章から画像を生成してDBに保存。
     * APIキーが未設定の場合は何もしない。非同期で実行。
     */
    @Async
    public void generateWinnerImageAsync(String roomPassphrase, int round) {
        if (!openAIImageService.isAvailable()) {
            return;
        }
        getWinnerSentenceAndGoal(roomPassphrase, round).ifPresent(tuple -> {
            openAIImageService.generateImageFromSentence(tuple.sentence(), tuple.goal())
                    .ifPresent(imageData -> roundWinnerImageDao.upsert(roomPassphrase, round, imageData));
        });
    }

    private Optional<WinnerTuple> getWinnerSentenceAndGoal(String roomPassphrase, int round) {
        String sql = """
                SELECT s.value as sentence, COALESCE(rg.goal, '') as goal
                FROM sentences s
                LEFT JOIN votes v ON v.sentence_id = s.id
                LEFT JOIN round_goals rg ON rg.room_passphrase = s.room_passphrase AND rg.round = s.round
                WHERE s.room_passphrase = ? AND s.round = ?
                GROUP BY s.id, s.value, rg.goal
                ORDER BY COUNT(v.id) DESC
                LIMIT 1
                """;
        return jdbcTemplate.query(sql, rs -> rs.next()
                ? Optional.of(new WinnerTuple(rs.getString("sentence"), rs.getString("goal")))
                : Optional.empty(),
                roomPassphrase, round);
    }

    private record WinnerTuple(String sentence, String goal) {}
}
