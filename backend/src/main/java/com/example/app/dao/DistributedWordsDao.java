package com.example.app.dao;

import com.example.app.domain.DistributedWords;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public class DistributedWordsDao {

    private final JdbcTemplate jdbcTemplate;
    private static final RowMapper<DistributedWords> ROW_MAPPER = (rs, rowNum) -> new DistributedWords(
            rs.getString("room_passphrase"),
            rs.getInt("round"),
            rs.getString("value")
    );

    public DistributedWordsDao(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public void insert(DistributedWords distributedWords) {
        jdbcTemplate.update(
                "INSERT INTO distributed_words (room_passphrase, round, value) VALUES (?, ?, ?)",
                distributedWords.roomPassphrase(), distributedWords.round(), distributedWords.value()
        );
    }

    public Optional<DistributedWords> findByRoomPassphraseAndRound(String roomPassphrase, int round) {
        List<DistributedWords> results = jdbcTemplate.query(
                "SELECT room_passphrase, round, value FROM distributed_words WHERE room_passphrase = ? AND round = ?",
                ROW_MAPPER, roomPassphrase, round
        );
        return results.isEmpty() ? Optional.empty() : Optional.of(results.getFirst());
    }
}
