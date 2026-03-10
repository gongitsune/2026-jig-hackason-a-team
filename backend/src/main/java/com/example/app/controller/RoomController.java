package com.example.app.controller;

import com.example.app.domain.Room;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/rooms")
public class RoomController {

    private final JdbcTemplate jdbcTemplate;

    public RoomController(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    /**
     * 部屋を立てる
     * POST /rooms/{passphrase}
     */
    @PostMapping("/{passphrase}")
    public ResponseEntity<Void> post(
            @PathVariable String passphrase
    ) {
        // 既にゲーム中の部屋がある場合は 400 を返す
        var count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM rooms WHERE passphrase = ? AND status = 'IN_GAME'",
                Integer.class,
                passphrase
        );

        if (count > 0) {
            return ResponseEntity.badRequest().build();
        }

        var room = new Room(passphrase, "WAITING", 1);

        // 部屋作成
        jdbcTemplate.update(
                "INSERT INTO rooms (passphrase, status, round) VALUES (?, ?, ?)",
                room.passphrase(),
                room.status(),
                room.round()
        );

        return ResponseEntity.ok().build();
    }

    /**
     * ゲーム開始
     * PUT /rooms/{passphrase} with JSON { "status": "WORD_INPUT" }
     */
    @PutMapping("/{passphrase}")
    public ResponseEntity<Void> put(
            @PathVariable String passphrase,
            @RequestBody Map<String, String> data
    ) {
        // repository getByPassphrase
        var room = jdbcTemplate.query(
                "SELECT passphrase, status, round FROM rooms WHERE passphrase = ?",
                rs -> rs.next() ? new Room(
                        rs.getString("passphrase"),
                        rs.getString("status"),
                        rs.getInt("round")
                ) : null,
                passphrase
        );

        if (room == null) {
            return ResponseEntity.notFound().build();
        }

        // entity update
        var updatedRoom = new Room(room.passphrase(), data.get("status"), room.round());

        // 部屋のステータスを更新
        jdbcTemplate.update(
                "UPDATE rooms SET status = ? WHERE passphrase = ?",
                updatedRoom.status(),
                passphrase
        );

        return ResponseEntity.ok().build();
    }
}