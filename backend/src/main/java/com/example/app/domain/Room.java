package com.example.app.domain;

/**
 * rooms テーブルに対応するドメインオブジェクト
 */
public record Room(
        String passphrase,
        String status,
        int round
) {
}
