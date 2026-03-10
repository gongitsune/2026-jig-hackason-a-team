package com.example.app.dao;

import com.example.app.domain.Vote;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

import java.sql.PreparedStatement;
import java.sql.Statement;
import java.util.List;

@Repository
public class VoteDao {

    private final JdbcTemplate jdbcTemplate;
    private static final RowMapper<Vote> ROW_MAPPER = (rs, rowNum) -> new Vote(
            rs.getLong("id"),
            rs.getString("room_passphrase"),
            rs.getString("user_id"),
            rs.getLong("sentence_id")
    );

    public VoteDao(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public Vote insert(Vote vote) {
        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbcTemplate.update(con -> {
            PreparedStatement ps = con.prepareStatement(
                    "INSERT INTO votes (room_passphrase, user_id, sentence_id) VALUES (?, ?, ?)",
                    Statement.RETURN_GENERATED_KEYS
            );
            ps.setString(1, vote.roomPassphrase());
            ps.setString(2, vote.userId());
            ps.setLong(3, vote.sentenceId());
            return ps;
        }, keyHolder);

        Number key = keyHolder.getKeys() != null ? (Number) keyHolder.getKeys().get("id") : null;
        long id = key != null ? key.longValue() : 0;
        return new Vote(id, vote.roomPassphrase(), vote.userId(), vote.sentenceId());
    }

    public int countByRoomPassphraseAndSentenceRound(String roomPassphrase, int round) {
        String sql = """
                SELECT COUNT(DISTINCT v.user_id) FROM votes v
                JOIN sentences s ON v.sentence_id = s.id
                WHERE v.room_passphrase = ? AND s.round = ?
                """;
        Integer count = jdbcTemplate.queryForObject(sql, Integer.class, roomPassphrase, round);
        return count != null ? count : 0;
    }

    public boolean existsByRoomPassphraseAndUserIdAndRound(String roomPassphrase, String userId, int round) {
        String sql = """
                SELECT COUNT(*) FROM votes v
                JOIN sentences s ON v.sentence_id = s.id
                WHERE v.room_passphrase = ? AND v.user_id = ? AND s.round = ?
                """;
        Integer count = jdbcTemplate.queryForObject(sql, Integer.class, roomPassphrase, userId, round);
        return count != null && count > 0;
    }
}
