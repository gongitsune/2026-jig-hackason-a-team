package com.example.app.domain;

/**
 * votes テーブルに対応するドメインオブジェクト
 */
public record Vote(
        long id,
        String roomPassphrase,
        String userId,
        long sentenceId
) {
}
