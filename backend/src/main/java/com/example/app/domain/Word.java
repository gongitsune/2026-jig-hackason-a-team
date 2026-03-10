package com.example.app.domain;

/**
 * words テーブルに対応するドメインオブジェクト
 */
public record Word(
        long id,
        String roomPassphrase,
        String userId,
        int round,
        String value
) {
}
