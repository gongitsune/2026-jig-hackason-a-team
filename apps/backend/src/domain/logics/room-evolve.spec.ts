import { describe, expect, it } from "vitest";

import { Room, RoomCode } from "../models/entities/room";
import { RoundId } from "../models/entities/round";
import { Sentence } from "../models/entities/sentence";
import { User, UserId, UserName } from "../models/entities/user";
import { Vote } from "../models/entities/vote";
import { SubmittedWord, Word } from "../models/entities/word";
import {
	SentenceInputPhase,
	VotePhase,
	WaitingPhase,
	WordInputPhase,
} from "../models/values/game-phase";
import { aggregateGameResult } from "../models/values/game-result";
import { GameEvent } from "../models/values/room-commands";
import { Topic } from "../models/values/topic";
import { evolve } from "./room-evolve";

describe("evolve", () => {
	describe("UserJoined", () => {
		it("ユーザーが部屋に追加される", () => {
			const room = Room(RoomCode("TEST"), [], WaitingPhase());
			const user = User(UserId(crypto.randomUUID()), UserName("Alice"));
			const event: GameEvent = { type: "UserJoined", user };

			const newRoom = evolve(room, event);

			expect(newRoom.users.length).toBe(1);
			expect(newRoom.users[0]).toEqual(user);
		});

		it("複数のユーザーが順次追加される", () => {
			const user1 = User(UserId(crypto.randomUUID()), UserName("Alice"));
			const user2 = User(UserId(crypto.randomUUID()), UserName("Bob"));

			let room = Room(RoomCode("TEST"), [], WaitingPhase());
			room = evolve(room, { type: "UserJoined", user: user1 });
			room = evolve(room, { type: "UserJoined", user: user2 });

			expect(room.users.length).toBe(2);
			expect(room.users[0]).toEqual(user1);
			expect(room.users[1]).toEqual(user2);
		});
	});

	describe("UserLeft", () => {
		it("ユーザーが部屋から削除される", () => {
			const user1 = User(UserId(crypto.randomUUID()), UserName("Alice"));
			const user2 = User(UserId(crypto.randomUUID()), UserName("Bob"));
			const room = Room(RoomCode("TEST"), [user1, user2], WaitingPhase());
			const event: GameEvent = { type: "UserLeft", userId: user1.id };

			const newRoom = evolve(room, event);

			expect(newRoom.users.length).toBe(1);
			expect(newRoom.users[0]).toEqual(user2);
		});

		it("全ユーザーが退出できる", () => {
			const user = User(UserId(crypto.randomUUID()), UserName("Alice"));
			let room = Room(RoomCode("TEST"), [user], WaitingPhase());
			room = evolve(room, { type: "UserLeft", userId: user.id });

			expect(room.users.length).toBe(0);
		});
	});

	describe("GameStarted", () => {
		it("WordInputPhase に遷移する", () => {
			const users = [
				User(UserId(crypto.randomUUID()), UserName("Alice")),
				User(UserId(crypto.randomUUID()), UserName("Bob")),
			];
			const room = Room(RoomCode("TEST"), users, WaitingPhase());
			const topic = Topic("世界で一番食べたくないもの");
			const roundId = RoundId("test-round");
			const event: GameEvent = { type: "GameStarted", topic, roundId };

			const newRoom = evolve(room, event);

			expect(newRoom.phase.tag).toBe("WordInputting");
			if (newRoom.phase.tag === "WordInputting") {
				expect(newRoom.phase.topic).toBe(topic);
				expect(newRoom.phase.roundId).toBe(roundId);
				expect(newRoom.phase.submitted.length).toBe(0);
			}
		});
	});

	describe("WordSubmitted", () => {
		it("単語が提出リストに追加される", () => {
			const users = [
				User(UserId(crypto.randomUUID()), UserName("Alice")),
				User(UserId(crypto.randomUUID()), UserName("Bob")),
			];
			const room = Room(
				RoomCode("TEST"),
				users,
				WordInputPhase(RoundId("test-round"), Topic("テストお題")),
			);
			const word = SubmittedWord(users[0].id, RoundId("test-round"), Word("激安"));
			const event: GameEvent = { type: "WordSubmitted", word };

			const newRoom = evolve(room, event);

			expect(newRoom.phase.tag).toBe("WordInputting");
			if (newRoom.phase.tag === "WordInputting") {
				expect(newRoom.phase.submitted.length).toBe(1);
				expect(newRoom.phase.submitted[0]).toEqual(word);
			}
		});

		it("複数の単語が順次追加される", () => {
			const users = [
				User(UserId(crypto.randomUUID()), UserName("Alice")),
				User(UserId(crypto.randomUUID()), UserName("Bob")),
			];
			const word1 = SubmittedWord(users[0].id, RoundId("test-round"), Word("激安"));
			const word2 = SubmittedWord(users[1].id, RoundId("test-round"), Word("ふにゃふにゃ"));

			let room = Room(
				RoomCode("TEST"),
				users,
				WordInputPhase(RoundId("test-round"), Topic("テストお題")),
			);
			room = evolve(room, { type: "WordSubmitted", word: word1 });
			room = evolve(room, { type: "WordSubmitted", word: word2 });

			expect(room.phase.tag).toBe("WordInputting");
			if (room.phase.tag === "WordInputting") {
				expect(room.phase.submitted.length).toBe(2);
				expect(room.phase.submitted[0]).toEqual(word1);
				expect(room.phase.submitted[1]).toEqual(word2);
			}
		});
	});

	describe("AllWordsSubmitted", () => {
		it("SentenceInputPhase に遷移する", () => {
			const users = [
				User(UserId(crypto.randomUUID()), UserName("Alice")),
				User(UserId(crypto.randomUUID()), UserName("Bob")),
			];
			const word1 = SubmittedWord(users[0].id, RoundId("test-round"), Word("激安"));
			const word2 = SubmittedWord(users[1].id, RoundId("test-round"), Word("ふにゃふにゃ"));
			const room = Room(
				RoomCode("TEST"),
				users,
				WordInputPhase(RoundId("test-round"), Topic("テストお題"), [word1, word2]),
			);
			const distributedWords = [Word("激安"), Word("ふにゃふにゃ"), Word("生"), Word("炒め")];
			const event: GameEvent = {
				type: "AllWordsSubmitted",
				roundId: RoundId("test-round"),
				distributedWords,
			};

			const newRoom = evolve(room, event);

			expect(newRoom.phase.tag).toBe("SentenceInputting");
			if (newRoom.phase.tag === "SentenceInputting") {
				expect(newRoom.phase.roundId).toEqual(RoundId("test-round"));
				expect(newRoom.phase.topic).toBe(Topic("テストお題"));
				expect(newRoom.phase.distributedWords).toEqual(distributedWords);
				expect(newRoom.phase.submitted.length).toBe(0);
			}
		});
	});

	describe("SentenceSubmitted", () => {
		it("文章が提出リストに追加される", () => {
			const users = [
				User(UserId(crypto.randomUUID()), UserName("Alice")),
				User(UserId(crypto.randomUUID()), UserName("Bob")),
			];
			const distributedWords = [Word("激安"), Word("ふにゃふにゃ"), Word("生"), Word("炒め")];
			const room = Room(
				RoomCode("TEST"),
				users,
				SentenceInputPhase(RoundId("test-round"), Topic("テストお題"), distributedWords),
			);
			const sentence = Sentence(users[0].id, RoundId("test-round"), "激安ふにゃふにゃ生炒め");
			const event: GameEvent = { type: "SentenceSubmitted", sentence };

			const newRoom = evolve(room, event);

			expect(newRoom.phase.tag).toBe("SentenceInputting");
			if (newRoom.phase.tag === "SentenceInputting") {
				expect(newRoom.phase.submitted.length).toBe(1);
				expect(newRoom.phase.submitted[0]).toEqual(sentence);
			}
		});

		it("複数の文章が順次追加される", () => {
			const users = [
				User(UserId(crypto.randomUUID()), UserName("Alice")),
				User(UserId(crypto.randomUUID()), UserName("Bob")),
			];
			const distributedWords = [Word("激安"), Word("ふにゃふにゃ"), Word("生"), Word("炒め")];
			const sentence1 = Sentence(users[0].id, RoundId("test-round"), "激安ふにゃふにゃ生炒め");
			const sentence2 = Sentence(
				users[1].id,
				RoundId("test-round"),
				"激安の生肉をふにゃふにゃに炒めたの",
			);

			let room = Room(
				RoomCode("TEST"),
				users,
				SentenceInputPhase(RoundId("test-round"), Topic("テストお題"), distributedWords),
			);
			room = evolve(room, { type: "SentenceSubmitted", sentence: sentence1 });
			room = evolve(room, { type: "SentenceSubmitted", sentence: sentence2 });

			expect(room.phase.tag).toBe("SentenceInputting");
			if (room.phase.tag === "SentenceInputting") {
				expect(room.phase.submitted.length).toBe(2);
				expect(room.phase.submitted[0]).toEqual(sentence1);
				expect(room.phase.submitted[1]).toEqual(sentence2);
			}
		});
	});

	describe("AllSentencesSubmitted", () => {
		it("VotePhase に遷移する", () => {
			const users = [
				User(UserId(crypto.randomUUID()), UserName("Alice")),
				User(UserId(crypto.randomUUID()), UserName("Bob")),
			];
			const distributedWords = [Word("激安"), Word("ふにゃふにゃ"), Word("生"), Word("炒め")];
			const sentence1 = Sentence(users[0].id, RoundId("test-round"), "激安ふにゃふにゃ生炒め");
			const sentence2 = Sentence(
				users[1].id,
				RoundId("test-round"),
				"激安の生肉をふにゃふにゃに炒めたの",
			);
			const room = Room(
				RoomCode("TEST"),
				users,
				SentenceInputPhase(RoundId("test-round"), Topic("テストお題"), distributedWords, [
					sentence1,
					sentence2,
				]),
			);
			const event: GameEvent = {
				type: "AllSentencesSubmitted",
				roundId: RoundId("test-round"),
				sentences: [sentence1, sentence2],
			};

			const newRoom = evolve(room, event);

			expect(newRoom.phase.tag).toBe("Voting");
			if (newRoom.phase.tag === "Voting") {
				expect(newRoom.phase.roundId).toEqual(RoundId("test-round"));
				expect(newRoom.phase.topic).toBe(Topic("テストお題"));
				expect(newRoom.phase.submitted.length).toBe(0);
			}
		});
	});

	describe("VoteSubmitted", () => {
		it("投票が提出リストに追加される", () => {
			const users = [
				User(UserId(crypto.randomUUID()), UserName("Alice")),
				User(UserId(crypto.randomUUID()), UserName("Bob")),
			];
			const sentences = [
				Sentence(users[0].id, RoundId("test-round"), "激安ふにゃふにゃ生炒め"),
				Sentence(users[1].id, RoundId("test-round"), "激安の生肉をふにゃふにゃに炒めたの"),
			];
			const room = Room(
				RoomCode("TEST"),
				users,
				VotePhase(RoundId("test-round"), Topic("テストお題"), sentences),
			);
			const vote = Vote(users[0].id, RoundId("test-round"), users[1].id);
			const event: GameEvent = { type: "VoteSubmitted", vote };

			const newRoom = evolve(room, event);

			expect(newRoom.phase.tag).toBe("Voting");
			if (newRoom.phase.tag === "Voting") {
				expect(newRoom.phase.submitted.length).toBe(1);
				expect(newRoom.phase.submitted[0]).toEqual(vote);
			}
		});

		it("複数の投票が順次追加される", () => {
			const users = [
				User(UserId(crypto.randomUUID()), UserName("Alice")),
				User(UserId(crypto.randomUUID()), UserName("Bob")),
				User(UserId(crypto.randomUUID()), UserName("Charlie")),
			];
			const sentences = [
				Sentence(users[0].id, RoundId("test-round"), "激安ふにゃふにゃ生炒め"),
				Sentence(users[1].id, RoundId("test-round"), "激安の生肉をふにゃふにゃに炒めたの"),
				Sentence(users[2].id, RoundId("test-round"), "生の激安肉をふにゃふにゃに炒めたの"),
			];
			const vote1 = Vote(users[0].id, RoundId("test-round"), users[1].id);
			const vote2 = Vote(users[1].id, RoundId("test-round"), users[2].id);

			let room = Room(
				RoomCode("TEST"),
				users,
				VotePhase(RoundId("test-round"), Topic("テストお題"), sentences),
			);
			room = evolve(room, { type: "VoteSubmitted", vote: vote1 });
			room = evolve(room, { type: "VoteSubmitted", vote: vote2 });

			expect(room.phase.tag).toBe("Voting");
			if (room.phase.tag === "Voting") {
				expect(room.phase.submitted.length).toBe(2);
				expect(room.phase.submitted[0]).toEqual(vote1);
				expect(room.phase.submitted[1]).toEqual(vote2);
			}
		});
	});

	describe("RoundEnded", () => {
		it("WaitingPhase に遷移する", () => {
			const users = [
				User(UserId(crypto.randomUUID()), UserName("Alice")),
				User(UserId(crypto.randomUUID()), UserName("Bob")),
			];
			const sentences = [
				Sentence(users[0].id, RoundId("test-round"), "激安ふにゃふにゃ生炒め"),
				Sentence(users[1].id, RoundId("test-round"), "激安の生肉をふにゃふにゃに炒めたの"),
			];
			const vote1 = Vote(users[0].id, RoundId("test-round"), users[1].id);
			const vote2 = Vote(users[1].id, RoundId("test-round"), users[0].id);
			const room = Room(
				RoomCode("TEST"),
				users,
				VotePhase(RoundId("test-round"), Topic("テストお題"), sentences, [vote1, vote2]),
			);

			const result = aggregateGameResult(1, Topic("テストお題"), sentences, users, [vote1, vote2]);
			const event: GameEvent = {
				type: "RoundEnded",
				roundId: RoundId("test-round"),
				result: result,
			};

			const newRoom = evolve(room, event);

			expect(newRoom.phase.tag).toBe("Waiting");
			if (newRoom.phase.tag === "Waiting") {
				expect(newRoom.phase.lastResult).toEqual(result);
			}
		});
	});

	describe("イベントの連続適用", () => {
		it("ゲーム全体のフローをイベントで再現できる", () => {
			const user1 = User(UserId(crypto.randomUUID()), UserName("Alice"));
			const user2 = User(UserId(crypto.randomUUID()), UserName("Bob"));

			// 初期状態
			let room = Room(RoomCode("TEST"), [], WaitingPhase());

			// ユーザー参加
			room = evolve(room, { type: "UserJoined", user: user1 });
			room = evolve(room, { type: "UserJoined", user: user2 });
			expect(room.users.length).toBe(2);
			expect(room.phase.tag).toBe("Waiting");

			// ゲーム開始
			room = evolve(room, {
				type: "GameStarted",
				topic: Topic("テストお題"),
				roundId: RoundId("test-round"),
			});
			expect(room.phase.tag).toBe("WordInputting");

			// 単語提出
			const word1 = SubmittedWord(user1.id, RoundId("test-round"), Word("激安"));
			const word2 = SubmittedWord(user2.id, RoundId("test-round"), Word("ふにゃふにゃ"));
			room = evolve(room, { type: "WordSubmitted", word: word1 });
			room = evolve(room, { type: "WordSubmitted", word: word2 });

			// 単語配布
			const distributedWords = [Word("激安"), Word("ふにゃふにゃ"), Word("生"), Word("炒め")];
			room = evolve(room, {
				type: "AllWordsSubmitted",
				roundId: RoundId("test-round"),
				distributedWords,
			});
			expect(room.phase.tag).toBe("SentenceInputting");

			// 文章提出
			const sentence1 = Sentence(user1.id, RoundId("test-round"), "激安ふにゃふにゃ生炒め");
			const sentence2 = Sentence(
				user2.id,
				RoundId("test-round"),
				"激安の生肉をふにゃふにゃに炒めたの",
			);
			room = evolve(room, { type: "SentenceSubmitted", sentence: sentence1 });
			room = evolve(room, { type: "SentenceSubmitted", sentence: sentence2 });

			// 投票フェーズへ
			room = evolve(room, {
				type: "AllSentencesSubmitted",
				roundId: RoundId("test-round"),
				sentences: [sentence1, sentence2],
			});
			expect(room.phase.tag).toBe("Voting");

			// 投票
			const vote1 = Vote(user1.id, RoundId("test-round"), user2.id);
			const vote2 = Vote(user2.id, RoundId("test-round"), user1.id);
			room = evolve(room, { type: "VoteSubmitted", vote: vote1 });
			room = evolve(room, { type: "VoteSubmitted", vote: vote2 });

			// ラウンド終了
			room = evolve(room, {
				type: "RoundEnded",
				roundId: RoundId("test-round"),
				result: aggregateGameResult(
					1,
					Topic("テストお題"),
					[sentence1, sentence2],
					[user1, user2],
					[vote1, vote2],
				),
			});
			expect(room.phase.tag).toBe("Waiting");
		});
	});
});
