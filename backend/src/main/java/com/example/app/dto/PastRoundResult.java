package com.example.app.dto;

import java.util.List;

/**
 * 過去ラウンドの結果。
 * round: ラウンド番号
 * goal: そのラウンドのお題
 * results: そのラウンドの各参加者の文章と得票数（得票数降順）
 * winnerImageAvailable: 1位の文章から生成した画像がある場合 true
 */
public record PastRoundResult(
        int round,
        String goal,
        List<SentenceResultWithUser> results,
        boolean winnerImageAvailable
) {}
