package com.example.app.dao;

import com.example.app.domain.User;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public class UserDao {

    private final JdbcTemplate jdbcTemplate;
    private static final RowMapper<User> ROW_MAPPER = (rs, rowNum) -> new User(
            rs.getString("id"),
            rs.getString("room_passphrase"),
            rs.getString("name")
    );

    public UserDao(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public void insert(User user) {
        jdbcTemplate.update(
                "INSERT INTO users (id, room_passphrase, name) VALUES (?, ?, ?)",
                user.id(), user.roomPassphrase(), user.name()
        );
    }

    public Optional<User> findById(String id) {
        List<User> results = jdbcTemplate.query(
                "SELECT id, room_passphrase, name FROM users WHERE id = ?",
                ROW_MAPPER, id
        );
        return results.isEmpty() ? Optional.empty() : Optional.of(results.getFirst());
    }

    public List<User> findByRoomPassphrase(String roomPassphrase) {
        return jdbcTemplate.query(
                "SELECT id, room_passphrase, name FROM users WHERE room_passphrase = ?",
                ROW_MAPPER, roomPassphrase
        );
    }

    public int countByRoomPassphrase(String roomPassphrase) {
        Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM users WHERE room_passphrase = ?",
                Integer.class, roomPassphrase
        );
        return count != null ? count : 0;
    }
}
