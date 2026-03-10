package com.example.app.dto;

import java.util.List;

public record MemberResponse(
        String userId,
        String name,
        String sentence, // null の場合あり
        List<SentenceResult> beforeResult // null または空の可能性あり
) {}
