package com.example.app.dao;

import com.example.app.domain.Room;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public class RoomDao {

    private final JdbcTemplate jdbcTemplate;
    private static final RowMapper<Room> ROW_MAPPER = (rs, rowNum) -> new Room(
            rs.getString("passphrase"),
            rs.getString("status"),
            rs.getInt("round")
    );

    public RoomDao(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public void insert(Room room) {
        jdbcTemplate.update(
                "INSERT INTO rooms (passphrase, status, round) VALUES (?, ?, ?)",
                room.passphrase(), room.status(), room.round()
        );
    }

    public Optional<Room> findByPassphrase(String passphrase) {
        List<Room> results = jdbcTemplate.query(
                "SELECT passphrase, status, round FROM rooms WHERE passphrase = ?",
                ROW_MAPPER, passphrase
        );
        return results.isEmpty() ? Optional.empty() : Optional.of(results.getFirst());
    }

    public void updateStatus(String passphrase, String status) {
        jdbcTemplate.update("UPDATE rooms SET status = ? WHERE passphrase = ?", status, passphrase);
    }

    public void updateStatusAndRound(String passphrase, String status, int round) {
        jdbcTemplate.update(
                "UPDATE rooms SET status = ?, round = ? WHERE passphrase = ?",
                status, round, passphrase
        );
    }
}
