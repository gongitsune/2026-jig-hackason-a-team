#!/bin/bash
# API テスト用 curl コマンド
# 事前に: docker compose up -d && psql -h localhost -p 5433 -U app -d app -f scripts/seed-for-test.sql
# バックエンド起動: ./mvnw spring-boot:run

BASE="http://localhost:8080"

echo "=== POST /rooms/{passphrase}/words テスト ==="
echo "user-a が単語投稿"
curl -s -w "\nstatus: %{http_code}\n" -X POST "$BASE/rooms/test-words/words" \
  -H "Content-Type: application/json" \
  -H "X-User-Id: user-a" \
  -d '{"value":"激安"}'

echo ""
echo "user-b が単語投稿（全員分揃う → SENTENCE_INPUT に遷移）"
curl -s -w "\nstatus: %{http_code}\n" -X POST "$BASE/rooms/test-words/words" \
  -H "Content-Type: application/json" \
  -H "X-User-Id: user-b" \
  -d '{"value":"ふにゃふにゃ"}'

echo ""
echo "=== POST /rooms/{passphrase}/sentences テスト ==="
echo "user-c が文章投稿"
curl -s -w "\nstatus: %{http_code}\n" -X POST "$BASE/rooms/test-sentences/sentences" \
  -H "Content-Type: application/json" \
  -H "X-User-Id: user-c" \
  -d '{"value":"激安ふにゃふにゃ生卵炒め"}'

echo ""
echo "user-d が文章投稿（全員分揃う → VOTE_INPUT に遷移）"
curl -s -w "\nstatus: %{http_code}\n" -X POST "$BASE/rooms/test-sentences/sentences" \
  -H "Content-Type: application/json" \
  -H "X-User-Id: user-d" \
  -d '{"value":"ふにゃふにゃ砂肝生炒め(激安)"}'

echo ""
echo "=== POST /rooms/{passphrase}/votes テスト ==="
echo "user-e が user-f に投票"
curl -s -w "\nstatus: %{http_code}\n" -X POST "$BASE/rooms/test-votes/votes" \
  -H "Content-Type: application/json" \
  -H "X-User-Id: user-e" \
  -d '{"targetUserId":"user-f"}'

echo ""
echo "user-f が user-e に投票（全員分揃う → WAITING, round++）"
curl -s -w "\nstatus: %{http_code}\n" -X POST "$BASE/rooms/test-votes/votes" \
  -H "Content-Type: application/json" \
  -H "X-User-Id: user-f" \
  -d '{"targetUserId":"user-e"}'
