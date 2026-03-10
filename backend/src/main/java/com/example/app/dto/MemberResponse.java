package com.example.app.dto;

public record MemberResponse(
        String userId,
        String name,
        String sentence // null の場合あり（SENTENCE_INPUT/VOTE_INPUT時のみ）
) {}
