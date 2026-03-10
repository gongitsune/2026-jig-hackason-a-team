package com.example.app.controller;

import com.example.app.dao.RoomDao;
import com.example.app.dao.SentenceDao;
import com.example.app.dao.UserDao;
import com.example.app.domain.Room;
import com.example.app.domain.Sentence;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/rooms/{passphrase}/sentences")
public class SentenceController {

    private static final String USER_ID_HEADER = "X-User-Id";
    private static final String STATUS_SENTENCE_INPUT = "SENTENCE_INPUT";
    private static final String STATUS_VOTE_INPUT = "VOTE_INPUT";

    private final SentenceDao sentenceDao;
    private final RoomDao roomDao;
    private final UserDao userDao;

    public SentenceController(SentenceDao sentenceDao, RoomDao roomDao, UserDao userDao) {
        this.sentenceDao = sentenceDao;
        this.roomDao = roomDao;
        this.userDao = userDao;
    }

    @PostMapping
    @Transactional
    public ResponseEntity<Void> postSentence(
            @PathVariable String passphrase,
            @RequestHeader(USER_ID_HEADER) String userId,
            @RequestBody Map<String, String> body
    ) {
        String value = body != null ? body.get("value") : null;
        if (value == null || value.isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        value = value.trim();

        Optional<Room> roomOpt = roomDao.findByPassphrase(passphrase);
        if (roomOpt.isEmpty()) {
            throw new IllegalArgumentException("Room not found");
        }
        Room room = roomOpt.get();
        if (!STATUS_SENTENCE_INPUT.equals(room.status())) {
            throw new IllegalStateException("Room is not in SENTENCE_INPUT status");
        }
        if (userDao.findByRoomPassphrase(passphrase).stream().noneMatch(u -> u.id().equals(userId))) {
            throw new IllegalArgumentException("User not in room");
        }
        int round = room.round();
        if (sentenceDao.existsByRoomPassphraseAndUserIdAndRound(passphrase, userId, round)) {
            throw new IllegalStateException("Already submitted sentence");
        }

        sentenceDao.insert(new Sentence(0, passphrase, userId, round, value));

        int sentenceCount = sentenceDao.countByRoomPassphraseAndRound(passphrase, round);
        int userCount = userDao.countByRoomPassphrase(passphrase);
        if (sentenceCount >= userCount) {
            roomDao.updateStatus(passphrase, STATUS_VOTE_INPUT);
        }
        return ResponseEntity.ok().build();
    }
}
