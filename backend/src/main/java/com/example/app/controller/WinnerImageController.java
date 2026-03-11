package com.example.app.controller;

import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.example.app.dao.RoundWinnerImageDao;

@RestController
@RequestMapping("/rooms/{passphrase}/rounds/{round}/winner-image")
public class WinnerImageController {

    private final RoundWinnerImageDao roundWinnerImageDao;

    public WinnerImageController(RoundWinnerImageDao roundWinnerImageDao) {
        this.roundWinnerImageDao = roundWinnerImageDao;
    }

    @GetMapping
    public ResponseEntity<byte[]> getWinnerImage(
            @PathVariable String passphrase,
            @PathVariable int round
    ) {
        return roundWinnerImageDao.findByRoomPassphraseAndRound(passphrase, round)
                .map(imageData -> ResponseEntity.ok()
                        .header(HttpHeaders.CONTENT_TYPE, MediaType.IMAGE_PNG_VALUE)
                        .header(HttpHeaders.CACHE_CONTROL, "public, max-age=86400")
                        .body(imageData))
                .orElse(ResponseEntity.notFound().build());
    }
}
