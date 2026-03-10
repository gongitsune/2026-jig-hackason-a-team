package com.example.app.dto;

/**
 * 文章と得票数、投稿者情報。
 * pastResults 内で使用。
 */
public record SentenceResultWithUser(
        String userId,
        String name,
        String sentence,
        int voteCount
) {}
