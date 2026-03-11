package com.example.app.controller;

import java.util.Map;
import java.util.Optional;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import com.example.app.dao.RoomDao;
import com.example.app.dao.SentenceDao;
import com.example.app.dao.UserDao;
import com.example.app.dao.VoteDao;
import com.example.app.domain.Room;
import com.example.app.domain.Sentence;
import com.example.app.domain.Vote;

@RestController
@RequestMapping("/rooms/{passphrase}/votes")
public class VoteController {

    private static final String USER_ID_HEADER = "X-User-Id";
    private static final String STATUS_VOTE_INPUT = "VOTE_INPUT";
    private static final String STATUS_WAITING = "WAITING";

    private final VoteDao voteDao;
    private final SentenceDao sentenceDao;
    private final RoomDao roomDao;
    private final UserDao userDao;

    public VoteController(VoteDao voteDao, SentenceDao sentenceDao, RoomDao roomDao, UserDao userDao) {
        this.voteDao = voteDao;
        this.sentenceDao = sentenceDao;
        this.roomDao = roomDao;
        this.userDao = userDao;
    }

    @PostMapping
    @Transactional
    public ResponseEntity<Void> postVote(
            @PathVariable String passphrase,
            @RequestHeader(USER_ID_HEADER) String userId,
            @RequestBody Map<String, String> body
    ) {
        String targetUserId = body != null ? body.get("targetUserId") : null;
        if (targetUserId == null || targetUserId.isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        final String target = targetUserId.trim();

        if (target.equals(userId)) {
            throw new IllegalArgumentException("Cannot vote for yourself");
        }

        // ルーム行をロックして同時投票時のレースコンディションを防止
        Optional<Room> roomOpt = roomDao.findByPassphraseForUpdate(passphrase);
        if (roomOpt.isEmpty()) {
            throw new IllegalArgumentException("Room not found");
        }
        Room room = roomOpt.get();
        if (!STATUS_VOTE_INPUT.equals(room.status())) {
            throw new IllegalStateException("Room is not in VOTE_INPUT status");
        }
        if (userDao.findByRoomPassphrase(passphrase).stream().noneMatch(u -> u.id().equals(userId))) {
            throw new IllegalArgumentException("User not in room");
        }
        if (userDao.findByRoomPassphrase(passphrase).stream().noneMatch(u -> u.id().equals(target))) {
            throw new IllegalArgumentException("Target user not in room");
        }

        int round = room.round();
        if (voteDao.existsByRoomPassphraseAndUserIdAndRound(passphrase, userId, round)) {
            throw new IllegalStateException("Already voted");
        }

        Optional<Sentence> targetSentenceOpt = sentenceDao.findByRoomPassphraseAndUserIdAndRound(passphrase, target, round);
        if (targetSentenceOpt.isEmpty()) {
            throw new IllegalArgumentException("Target user has no sentence for this round");
        }
        long sentenceId = targetSentenceOpt.get().id();

        voteDao.insert(new Vote(0, passphrase, userId, sentenceId));

        int voteCount = voteDao.countByRoomPassphraseAndSentenceRound(passphrase, round);
        int userCount = userDao.countByRoomPassphrase(passphrase);
        if (voteCount >= userCount) {
            roomDao.updateStatusAndRound(passphrase, STATUS_WAITING, round + 1);
        }
        return ResponseEntity.ok().build();
    }
}
