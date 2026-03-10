package com.example.app.dao;

import com.example.app.domain.Sentence;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

import java.sql.PreparedStatement;
import java.sql.Statement;
import java.util.List;

@Repository
public class SentenceDao {

    private final JdbcTemplate jdbcTemplate;
    private static final RowMapper<Sentence> ROW_MAPPER = (rs, rowNum) -> new Sentence(
            rs.getLong("id"),
            rs.getString("room_passphrase"),
            rs.getString("user_id"),
            rs.getInt("round"),
            rs.getString("value")
    );

    public SentenceDao(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public Sentence insert(Sentence sentence) {
        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbcTemplate.update(con -> {
            PreparedStatement ps = con.prepareStatement(
                    "INSERT INTO sentences (room_passphrase, user_id, round, value) VALUES (?, ?, ?, ?)",
                    Statement.RETURN_GENERATED_KEYS
            );
            ps.setString(1, sentence.roomPassphrase());
            ps.setString(2, sentence.userId());
            ps.setInt(3, sentence.round());
            ps.setString(4, sentence.value());
            return ps;
        }, keyHolder);

        long id = keyHolder.getKey() != null ? keyHolder.getKey().longValue() : 0;
        return new Sentence(id, sentence.roomPassphrase(), sentence.userId(), sentence.round(), sentence.value());
    }

    public List<Sentence> findByRoomPassphraseAndRound(String roomPassphrase, int round) {
        return jdbcTemplate.query(
                "SELECT id, room_passphrase, user_id, round, value FROM sentences WHERE room_passphrase = ? AND round = ?",
                ROW_MAPPER, roomPassphrase, round
        );
    }

    public int countByRoomPassphraseAndRound(String roomPassphrase, int round) {
        Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM sentences WHERE room_passphrase = ? AND round = ?",
                Integer.class, roomPassphrase, round
        );
        return count != null ? count : 0;
    }

    public boolean existsByRoomPassphraseAndUserIdAndRound(String roomPassphrase, String userId, int round) {
        Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM sentences WHERE room_passphrase = ? AND user_id = ? AND round = ?",
                Integer.class, roomPassphrase, userId, round
        );
        return count != null && count > 0;
    }
}