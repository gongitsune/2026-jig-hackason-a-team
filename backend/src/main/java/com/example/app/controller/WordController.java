package com.example.app.controller;

import com.example.app.dao.DistributedWordsDao;
import com.example.app.dao.RoomDao;
import com.example.app.dao.UserDao;
import com.example.app.dao.WordDao;
import com.example.app.domain.DistributedWords;
import com.example.app.domain.Room;
import com.example.app.domain.Word;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/rooms/{passphrase}/words")
public class WordController {

    private static final String USER_ID_HEADER = "X-User-Id";
    private static final String STATUS_WORD_INPUT = "WORD_INPUT";
    private static final String STATUS_SENTENCE_INPUT = "SENTENCE_INPUT";
    private static final int REQUIRED_WORDS_FOR_DISTRIBUTION = 4;

    private static final List<String> RANDOM_WORD_POOL = List.of(
            "激安", "ふにゃふにゃ", "生", "炒め", "虹色", "砂肝", "卵", "肉", "唐揚げ", "寿司",
            "ラーメン", "カレー", "ピザ", "焼き鳥", "天ぷら", "うどん", "そば", "パスタ"
    );

    private final WordDao wordDao;
    private final RoomDao roomDao;
    private final UserDao userDao;
    private final DistributedWordsDao distributedWordsDao;
    private final Random random = new Random();

    public WordController(WordDao wordDao, RoomDao roomDao, UserDao userDao, DistributedWordsDao distributedWordsDao) {
        this.wordDao = wordDao;
        this.roomDao = roomDao;
        this.userDao = userDao;
        this.distributedWordsDao = distributedWordsDao;
    }

    @PostMapping
    @Transactional
    public ResponseEntity<Void> postWord(
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
        if (!STATUS_WORD_INPUT.equals(room.status())) {
            throw new IllegalStateException("Room is not in WORD_INPUT status");
        }
        if (userDao.findByRoomPassphrase(passphrase).stream().noneMatch(u -> u.id().equals(userId))) {
            throw new IllegalArgumentException("User not in room");
        }
        int round = room.round();
        if (wordDao.existsByRoomPassphraseAndUserIdAndRound(passphrase, userId, round)) {
            throw new IllegalStateException("Already submitted word");
        }

        wordDao.insert(new Word(0, passphrase, userId, round, value));

        int wordCount = wordDao.countByRoomPassphraseAndRound(passphrase, round);
        int userCount = userDao.countByRoomPassphrase(passphrase);
        if (wordCount >= userCount) {
            transitionToSentenceInput(passphrase, round);
        }
        return ResponseEntity.ok().build();
    }

    private void transitionToSentenceInput(String passphrase, int round) {
        List<String> userWordValues = wordDao.findByRoomPassphraseAndRound(passphrase, round).stream()
                .map(Word::value)
                .collect(Collectors.toList());
        List<String> randomWords = pickRandomWords(6);
        List<String> pool = new ArrayList<>(userWordValues);
        pool.addAll(randomWords);
        Collections.shuffle(pool, random);
        List<String> distributed = pool.stream().limit(REQUIRED_WORDS_FOR_DISTRIBUTION).collect(Collectors.toList());
        distributedWordsDao.insert(new DistributedWords(passphrase, round, String.join(",", distributed)));
        roomDao.updateStatus(passphrase, STATUS_SENTENCE_INPUT);
    }

    private List<String> pickRandomWords(int count) {
        if (count <= 0) return List.of();
        List<String> shuffled = new ArrayList<>(RANDOM_WORD_POOL);
        Collections.shuffle(shuffled, random);
        return shuffled.stream().limit(count).collect(Collectors.toList());
    }
}
