package com.example.app.domain;

/**
 * users テーブルに対応するドメインオブジェクト
 */
public record User(
        String id,
        String roomPassphrase,
        String name
) {
}
