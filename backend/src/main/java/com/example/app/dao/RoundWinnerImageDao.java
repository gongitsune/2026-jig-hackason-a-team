package com.example.app.dao;

import java.util.Optional;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class RoundWinnerImageDao {

    private final JdbcTemplate jdbcTemplate;

    public RoundWinnerImageDao(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public void upsert(String roomPassphrase, int round, byte[] imageData) {
        jdbcTemplate.update(
                """
                INSERT INTO round_winner_images (room_passphrase, round, image_data)
                VALUES (?, ?, ?)
                ON CONFLICT (room_passphrase, round) DO UPDATE SET image_data = EXCLUDED.image_data
                """,
                roomPassphrase, round, imageData
        );
    }

    public Optional<byte[]> findByRoomPassphraseAndRound(String roomPassphrase, int round) {
        return jdbcTemplate.query(
                "SELECT image_data FROM round_winner_images WHERE room_passphrase = ? AND round = ?",
                rs -> rs.next() ? Optional.of(rs.getBytes("image_data")) : Optional.empty(),
                roomPassphrase, round
        );
    }

    public boolean existsByRoomPassphraseAndRound(String roomPassphrase, int round) {
        Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM round_winner_images WHERE room_passphrase = ? AND round = ?",
                Integer.class, roomPassphrase, round
        );
        return count != null && count > 0;
    }
}
