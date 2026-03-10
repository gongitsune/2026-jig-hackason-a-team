-- テスト用の初期データ
-- 実行: psql -h localhost -p 5433 -U app -d app -f scripts/seed-for-test.sql

-- 既存データ削除（テスト用）
TRUNCATE votes, sentences, words, distributed_words, users, rooms RESTART IDENTITY CASCADE;

-- ルーム1: 単語投稿テスト用 (status = WORD_INPUT)
INSERT INTO rooms (passphrase, status, round) VALUES
  ('test-words', 'WORD_INPUT', 1);

-- ルーム2: 文章投稿テスト用 (status = SENTENCE_INPUT)
INSERT INTO rooms (passphrase, status, round) VALUES
  ('test-sentences', 'SENTENCE_INPUT', 1);

-- ルーム3: 投票テスト用 (status = VOTE_INPUT)
INSERT INTO rooms (passphrase, status, round) VALUES
  ('test-votes', 'VOTE_INPUT', 1);

-- ユーザー
INSERT INTO users (id, room_passphrase, name) VALUES
  ('user-a', 'test-words', 'プレイヤーA'),
  ('user-b', 'test-words', 'プレイヤーB'),
  ('user-c', 'test-sentences', 'プレイヤーC'),
  ('user-d', 'test-sentences', 'プレイヤーD'),
  ('user-e', 'test-votes', 'プレイヤーE'),
  ('user-f', 'test-votes', 'プレイヤーF');

-- 文章テスト用: 配布単語を登録
INSERT INTO distributed_words (room_passphrase, round, value) VALUES
  ('test-sentences', 1, '激安,ふにゃふにゃ,生,炒め'),
  ('test-votes', 1, '激安,ふにゃふにゃ,生,炒め');

-- 投票テスト用: 文章を登録（user-e, user-f が各1つ）
INSERT INTO sentences (room_passphrase, user_id, round, value) VALUES
  ('test-votes', 'user-e', 1, '激安ふにゃふにゃ生卵炒め'),
  ('test-votes', 'user-f', 1, 'ふにゃふにゃ砂肝生炒め(激安)');
