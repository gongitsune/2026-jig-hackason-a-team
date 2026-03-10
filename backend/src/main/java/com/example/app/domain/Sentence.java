package com.example.app.domain;

/**
 * sentences テーブルに対応するドメインオブジェクト
 */
public record Sentence(
        long id,
        String roomPassphrase,
        String userId,
        int round,
        String value
) {
}
