package com.example.app.dto;

import java.util.List;

public record RoomResponse(
        String status,
        List<MemberResponse> members,
        String goal,
        List<String> distributedWords
) {}
