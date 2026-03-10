package com.example.app.dao;

import com.example.app.domain.Word;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

import java.sql.PreparedStatement;
import java.sql.Statement;
import java.util.List;

@Repository
public class WordDao {

    private final JdbcTemplate jdbcTemplate;
    private static final RowMapper<Word> ROW_MAPPER = (rs, rowNum) -> new Word(
            rs.getLong("id"),
            rs.getString("room_passphrase"),
            rs.getString("user_id"),
            rs.getInt("round"),
            rs.getString("value")
    );

    public WordDao(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public Word insert(Word word) {
        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbcTemplate.update(con -> {
            PreparedStatement ps = con.prepareStatement(
                    "INSERT INTO words (room_passphrase, user_id, round, value) VALUES (?, ?, ?, ?)",
                    Statement.RETURN_GENERATED_KEYS
            );
            ps.setString(1, word.roomPassphrase());
            ps.setString(2, word.userId());
            ps.setInt(3, word.round());
            ps.setString(4, word.value());
            return ps;
        }, keyHolder);

        long id = keyHolder.getKey() != null ? keyHolder.getKey().longValue() : 0;
        return new Word(id, word.roomPassphrase(), word.userId(), word.round(), word.value());
    }

    public List<Word> findByRoomPassphraseAndRound(String roomPassphrase, int round) {
        return jdbcTemplate.query(
                "SELECT id, room_passphrase, user_id, round, value FROM words WHERE room_passphrase = ? AND round = ?",
                ROW_MAPPER, roomPassphrase, round
        );
    }

    public int countByRoomPassphraseAndRound(String roomPassphrase, int round) {
        Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM words WHERE room_passphrase = ? AND round = ?",
                Integer.class, roomPassphrase, round
        );
        return count != null ? count : 0;
    }
}
