package com.example.app.dto;

import java.util.List;

public record MemberResponse(
        String userId,
        String name,
        String sentence, // Can be null
        List<SentenceResult> beforeResult // Can be null or empty
) {}
