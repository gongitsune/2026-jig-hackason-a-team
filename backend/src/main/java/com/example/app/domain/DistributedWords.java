package com.example.app.domain;

/**
 * distributed_words テーブルに対応するドメインオブジェクト
 */
public record DistributedWords(
        String roomPassphrase,
        int round,
        String value
) {
}
