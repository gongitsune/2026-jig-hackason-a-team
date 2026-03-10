package com.example.app.dto;

import java.util.List;

public record RoomResponse(
        String status,
        List<MemberResponse> members,
        String goal,
        List<String> distributedWords,
        List<PastRoundResult> pastResults // 過去ラウンドの文章・得票数（WAITING時にstart画面で表示）
) {}
