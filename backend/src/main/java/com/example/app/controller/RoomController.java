package com.example.app.controller;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;
import com.example.app.dao.RoomDao;
import com.example.app.dao.UserDao;
import com.example.app.domain.Room;
import com.example.app.domain.User;
import com.example.app.dto.MemberResponse;
import com.example.app.dto.RoomResponse;
import com.example.app.dto.SentenceResult;
import com.fasterxml.jackson.databind.JsonNode;

@RestController
@RequestMapping("/rooms")
public class RoomController {

    private final JdbcTemplate jdbcTemplate;
    private final RoomDao roomDao;
    private final UserDao userDao;

    public RoomController(JdbcTemplate jdbcTemplate, RoomDao roomDao, UserDao userDao) {
        this.jdbcTemplate = jdbcTemplate;
        this.roomDao = roomDao;
        this.userDao = userDao;
    }

    /**
     * 部屋を立てる / 参加する
     * POST /rooms/{passphrase}
     * body: { "userName": "xxx" }
     * - 部屋がなければ作成してユーザーを登録
     * - 部屋が WAITING ならユーザーを参加させる
     * - 部屋がゲーム中なら 400
     */
    @PostMapping("/{passphrase}")
    public ResponseEntity<Void> post(
            @RequestHeader Map<String, String> headers,
            @PathVariable String passphrase,
            @RequestBody JsonNode data
    ) {
        String userId = headers != null ? headers.getOrDefault("x-user-id", headers.get("X-User-Id")) : null;
        String userName = (data != null && data.has("userName")) ? data.get("userName").asText() : null;
        if (userId == null || userId.isBlank() || userName == null || userName.isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        userName = userName.trim();

        Optional<Room> existingRoom = roomDao.findByPassphrase(passphrase);
        if (existingRoom.isPresent()) {
            Room room = existingRoom.get();
            if (!"WAITING".equals(room.status())) {
                return ResponseEntity.badRequest().build();
            }
            addOrUpdateUser(userId, passphrase, userName);
            return ResponseEntity.ok().build();
        }

        roomDao.insert(new Room(passphrase, "WAITING", 1, ""));
        addOrUpdateUser(userId, passphrase, userName);
        return ResponseEntity.ok().build();
    }

    private void addOrUpdateUser(String userId, String passphrase, String userName) {
        Optional<User> existingUser = userDao.findById(userId);
        if (existingUser.isEmpty()) {
            userDao.insert(new User(userId, Optional.of(passphrase), userName));
        } else {
            userDao.updateRoomAndName(userId, passphrase, userName);
        }
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

        String requestedStatus = data != null ? data.get("status") : null;
        if (!"WORD_INPUT".equals(requestedStatus)) {
            return ResponseEntity.badRequest().build();
        }

        String currentStatus = room.status();
        if ("WAITING".equals(currentStatus)) {
            // ゲーム開始: WAITING → WORD_INPUT（round の加算は Vote API で行う）
            jdbcTemplate.update(
                    "UPDATE rooms SET status = ? WHERE passphrase = ?",
                    "WORD_INPUT",
                    passphrase
            );
        }
        // 既に WORD_INPUT 以降なら 200 を返すだけ（冪等）

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

        // 配布された単語を取得（DB はカンマ区切りで保存、クライアントは単語の配列を期待）
        List<String> distributedWordsRaw = jdbcTemplate.queryForList(
                "SELECT value FROM distributed_words WHERE room_passphrase = ? AND round = ?",
                String.class,
                passphrase,
                currentRound
        );
        List<String> distributedWords = distributedWordsRaw.stream()
                .flatMap(s -> Arrays.stream(s.split(",")))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .toList();

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
        