package com.example.app.controller;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Random;
import java.util.stream.Collectors;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import com.example.app.dao.DistributedWordsDao;
import com.example.app.dao.RoomDao;
import com.example.app.dao.UserDao;
import com.example.app.dao.WordDao;
import com.example.app.domain.DistributedWords;
import com.example.app.domain.Room;
import com.example.app.domain.Word;
import com.example.app.pkgs.json.JsonLoader;

@RestController
@RequestMapping("/rooms/{passphrase}/words")
public class WordController {

    private static final String USER_ID_HEADER = "X-User-Id";
    private static final String STATUS_WORD_INPUT = "WORD_INPUT";
    private static final String STATUS_SENTENCE_INPUT = "SENTENCE_INPUT";
    private static final int REQUIRED_WORDS_FOR_DISTRIBUTION = 10;

    private static final List<String> RANDOM_WORD_POOL = JsonLoader.loadStringArray("words.json");

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
        Collections.shuffle(userWordValues, random);

        List<String> distributed = new ArrayList<>(
                userWordValues.stream().limit(REQUIRED_WORDS_FOR_DISTRIBUTION).collect(Collectors.toList()));

        if (distributed.size() < REQUIRED_WORDS_FOR_DISTRIBUTION) {
            int needed = REQUIRED_WORDS_FOR_DISTRIBUTION - distributed.size();
            distributed.addAll(pickRandomWords(needed));
        }

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
