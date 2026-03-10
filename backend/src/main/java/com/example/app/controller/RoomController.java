package com.example.app.controller;

import com.example.app.domain.Room;
import com.example.app.domain.User;
import com.example.app.dto.MemberResponse;
import com.example.app.dto.RoomResponse;
import com.example.app.dto.SentenceResult;
import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.web.bind.annotation.*;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.*;

@RestController
@RequestMapping("/rooms")
public class
RoomController {

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
            @RequestHeader Map<String, String> headers,
            @PathVariable String passphrase,
            @RequestBody JsonNode data
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

        var room = new Room(passphrase, "WAITING", 1, ""); // goal を空文字で初期化

        // 部屋作成
        jdbcTemplate.update(
                "INSERT INTO rooms (passphrase, status, round, goal) VALUES (?, ?, ?, ?)",
                room.passphrase(),
                room.status(),
                room.round(),
                room.goal()
        );

        var user = new User(
                headers.get("x-user-id"),
                Optional.of(passphrase),
                data.get("userName").asText()
        );

        jdbcTemplate.update(
                "INSERT INTO users (id, room_passphrase, name) VALUES (?, ?, ?)",
                user.id(),
                user.roomPassphrase().orElse(null),
                user.name()
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
        // passphrase でルーム取得
        var room = jdbcTemplate.query(
                "SELECT passphrase, status, round, goal FROM rooms WHERE passphrase = ?",
                rs -> rs.next() ? new Room(
                        rs.getString("passphrase"),
                        rs.getString("status"),
                        rs.getInt("round"),
                        rs.getString("goal")
                ) : null,
                passphrase
        );

        if (room == null) {
            return ResponseEntity.notFound().build();
        }

        // エンティティ更新（goal は維持）
        var updatedRoom = new Room(room.passphrase(), data.get("status"), room.round(), room.goal());

        // 部屋のステータスを更新
        jdbcTemplate.update(
                "UPDATE rooms SET status = ? WHERE passphrase = ?",
                updatedRoom.status(),
                passphrase
        );

        return ResponseEntity.ok().build();
    }

    /**
     * 部屋の情報を取得する
     * GET /rooms/{passphrase}
     */
    @GetMapping("/{passphrase}")
    public ResponseEntity<RoomResponse> getRoomStatus(@PathVariable String passphrase) {
        Room room = jdbcTemplate.query(
                "SELECT passphrase, status, round, goal FROM rooms WHERE passphrase = ?",
                rs -> rs.next() ? new Room(
                        rs.getString("passphrase"),
                        rs.getString("status"),
                        rs.getInt("round"),
                        rs.getString("goal")
                ) : null,
                passphrase
        );

        if (room == null) {
            // 部屋がない場合は WAITING 状態を返す
            return ResponseEntity.ok(new RoomResponse(
                    "WAITING",
                    Collections.emptyList(),
                    "",
                    Collections.emptyList()
            ));
        }

        int currentRound = room.round();
        String roomStatus = room.status();
        String roomGoal = room.goal();

        // 配布された単語を取得
        List<String> distributedWords = jdbcTemplate.queryForList(
                "SELECT value FROM distributed_words WHERE room_passphrase = ? AND round = ?",
                String.class,
                passphrase,
                currentRound
        );

        // 参加者を取得
        List<MemberResponse> members = jdbcTemplate.query(
            "SELECT id, name FROM users WHERE room_passphrase = ?",
            new RowMapper<MemberResponse>() {
                @Override
                public MemberResponse mapRow(ResultSet rs, int rowNum) throws SQLException {
                    String userId = rs.getString("id");
                    String name = rs.getString("name");
                    String sentence = null;
                    List<SentenceResult> beforeResult = Collections.emptyList();

                    if (roomStatus.equals("SENTENCE_INPUT") || roomStatus.equals("VOTE_INPUT")) {
                        // 現在ラウンドのユーザー文章を取得
                        sentence = jdbcTemplate.query(
                                "SELECT value FROM sentences WHERE room_passphrase = ? AND user_id = ? AND round = ?",
                                (sentenceRs) -> sentenceRs.next() ? sentenceRs.getString("value") : null,
                                passphrase, userId, currentRound
                        );
                    }

                    if (roomStatus.equals("VOTE_INPUT") && currentRound > 1) {
                        // 前ラウンドの文章と得票数を取得
                        int previousRound = currentRound - 1;
                        beforeResult = jdbcTemplate.query(
                            "SELECT s.value, COUNT(v.id) as vote_count " +
                                    "FROM sentences s LEFT JOIN votes v ON s.id = v.sentence_id " +
                                    "WHERE s.room_passphrase = ? AND s.round = ? " +
                                    "GROUP BY s.id, s.value",
                            (rsSentenceResult, rowNumSentenceResult) -> new SentenceResult(
                                    rsSentenceResult.getString("value"),
                                    rsSentenceResult.getInt("vote_count")
                            ),
                            passphrase, previousRound
                        );
                    }
                    return new MemberResponse(userId, name, sentence, beforeResult);
                }
            },
            passphrase
        );

        return ResponseEntity.ok(new RoomResponse(
            roomStatus,
            members,
            roomGoal,
            distributedWords
        ));
    }
}
        