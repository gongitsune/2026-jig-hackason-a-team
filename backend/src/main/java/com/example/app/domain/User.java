package com.example.app.domain;

import java.util.Optional;

/**
 * users テーブルに対応するドメインオブジェクト
 */
public record User(
        String id,
        Optional<String> roomPassphrase,
        String name
) {
}
