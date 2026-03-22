import { describe, expect, it } from "vitest";

import { User, UserId, UserName } from "../user/user";
import { decide } from "./decide";
import {
	SentenceInputPhase,
	VotePhase,
	WaitingPhase,
	WordInputPhase,
} from "./value-objects/game-phase";
import { Room, RoomCode } from "./value-objects/room";
import { RoundId } from "./value-objects/round";
import { Sentence } from "./value-objects/sentence";
import { Topic } from "./value-objects/topic";
import { Vote } from "./value-objects/vote";
import { SubmittedWord, Word } from "./value-objects/word";

const makeRoomWithUsers = (userCount: number): Room => {
	return Room(
		RoomCode("TEST"),
		Array.from({ length: userCount }, (_, i) =>
			User(UserId(crypto.randomUUID()), UserName(`User${i + 1}`)),
		),
		WaitingPhase(),
	);
};

// oxlint-disable-next-line max-lines-per-function
describe("decide", () => {
	it("ユーザーが部屋に参加", () => {
		const room = makeRoomWithUsers(0);
		const user = User(UserId(crypto.randomUUID()), UserName("Alice"));
		const result = decide(room, { type: "Join", user });

		expect(result.type).toBe("Success");
		if (result.type === "Failure") return;

		expect(result.events.length).toBe(1);
		expect(result.events[0].type).toEqual("UserJoined");
		if (result.events[0].type === "UserJoined") {
			expect(result.events[0].user).toEqual(user);
		}
	});

	it("ユーザーが部屋から退出", () => {
		const user = User(UserId(crypto.randomUUID()), UserName("Bob"));
		const room = makeRoomWithUsers(2);
		const roomWithUser = {
			...room,
			users: [...room.users, user],
		};
		const result = decide(roomWithUser, { type: "Leave", user });

		expect(result.type).toBe("Success");
		if (result.type === "Failure") return;

		expect(result.events.length).toBe(1);
		expect(result.events[0].type).toEqual("UserLeft");
		if (result.events[0].type === "UserLeft") {
			expect(result.events[0].user).toEqual(user);
		}
	});

	it("部屋に2人以上いる時、ゲームスタート", () => {
		const room = makeRoomWithUsers(2);
		const result = decide(room, {
			type: "StartGame",
			topic: Topic("一番食べたくないもの"),
			roundId: RoundId(1),
		});
		expect(result.type).toBe("Success");
		if (result.type === "Failure") return;
		expect(result.events.length).toBe(1);
		expect(result.events[0].type).toEqual("GameStarted");
	});

	it("部屋に2人未満の時、ゲームスタート失敗", () => {
		const room = makeRoomWithUsers(1);
		const result = decide(room, {
			type: "StartGame",
			topic: Topic("一番食べたくないもの"),
			roundId: RoundId(1),
		});
		expect(result.type).toBe("Failure");
		if (result.type === "Success") return;
		expect(result.reason).toBe("Not enough players to start the game");
	});

	it("ゲーム開始後はユーザー参加失敗", () => {
		const users = Array.from({ length: 2 }, (_, i) =>
			User(UserId(crypto.randomUUID()), UserName(`User${i + 1}`)),
		);
		const room = Room(
			RoomCode("TEST"),
			users,
			WordInputPhase(RoundId(1), Topic("テストお題")),
		);
		const newUser = User(UserId(crypto.randomUUID()), UserName("NewUser"));
		const result = decide(room, { type: "Join", user: newUser });

		expect(result.type).toBe("Failure");
		if (result.type === "Success") return;
		expect(result.reason).toBe("Game already started");
	});

	it("既に参加しているユーザーは再参加失敗", () => {
		const user = User(UserId(crypto.randomUUID()), UserName("Alice"));
		const room = Room(RoomCode("TEST"), [user], WaitingPhase());
		const result = decide(room, { type: "Join", user });

		expect(result.type).toBe("Failure");
		if (result.type === "Success") return;
		expect(result.reason).toBe("User already in the room");
	});

	it("存在しないユーザーの退出は失敗", () => {
		const room = makeRoomWithUsers(2);
		const nonExistentUser = User(UserId(crypto.randomUUID()), UserName("Ghost"));
		const result = decide(room, { type: "Leave", user: nonExistentUser });

		expect(result.type).toBe("Failure");
		if (result.type === "Success") return;
		expect(result.reason).toBe("User not in the room");
	});

	it("ゲーム開始後はユーザー退出失敗", () => {
		const users = Array.from({ length: 2 }, (_, i) =>
			User(UserId(crypto.randomUUID()), UserName(`User${i + 1}`)),
		);
		const room = Room(
			RoomCode("TEST"),
			users,
			WordInputPhase(RoundId(1), Topic("テストお題")),
		);
		const result = decide(room, { type: "Leave", user: users[0] });

		expect(result.type).toBe("Failure");
		if (result.type === "Success") return;
		expect(result.reason).toBe("Game already started");
	});

	describe("単語提出", () => {
		it("単語を提出できる", () => {
			const users = Array.from({ length: 3 }, (_, i) =>
				User(UserId(crypto.randomUUID()), UserName(`User${i + 1}`)),
			);
			const room = Room(
				RoomCode("TEST"),
				users,
				WordInputPhase(RoundId(1), Topic("テストお題")),
			);
			const word = SubmittedWord(users[0].id, RoundId(1), Word("激安"));
			const result = decide(room, {
				type: "SubmitWord",
				word,
				systemWords: [],
			});

			expect(result.type).toBe("Success");
			if (result.type === "Failure") return;
			expect(result.events.length).toBe(1);
			expect(result.events[0].type).toBe("WordSubmitted");
		});

		it("全員が単語を提出したら AllWordsSubmitted イベントが発生", () => {
			const users = Array.from({ length: 2 }, (_, i) =>
				User(UserId(crypto.randomUUID()), UserName(`User${i + 1}`)),
			);
			const word1 = SubmittedWord(users[0].id, RoundId(1), Word("激安"));
			const room = Room(
				RoomCode("TEST"),
				users,
				WordInputPhase(RoundId(1), Topic("テストお題"), [word1]),
			);
			const word2 = SubmittedWord(users[1].id, RoundId(1), Word("ふにゃふにゃ"));
			const systemWords = [
				Word("生"),
				Word("炒め"),
				Word("野菜"),
				Word("肉"),
				Word("魚"),
				Word("卵"),
				Word("米"),
				Word("パン"),
				Word("麺"),
				Word("スープ"),
			];
			const result = decide(room, {
				type: "SubmitWord",
				word: word2,
				systemWords,
			});

			expect(result.type).toBe("Success");
			if (result.type === "Failure") return;
			expect(result.events.length).toBe(2);
			expect(result.events[0].type).toBe("WordSubmitted");
			expect(result.events[1].type).toBe("AllWordsSubmitted");
			if (result.events[1].type === "AllWordsSubmitted") {
				expect(result.events[1].distributedWords.length).toBe(10);
			}
		});

		it("同じユーザーが2回単語提出すると失敗", () => {
			const users = Array.from({ length: 2 }, (_, i) =>
				User(UserId(crypto.randomUUID()), UserName(`User${i + 1}`)),
			);
			const word1 = SubmittedWord(users[0].id, RoundId(1), Word("激安"));
			const room = Room(
				RoomCode("TEST"),
				users,
				WordInputPhase(RoundId(1), Topic("テストお題"), [word1]),
			);
			const word2 = SubmittedWord(users[0].id, RoundId(1), Word("ふにゃふにゃ"));
			const result = decide(room, {
				type: "SubmitWord",
				word: word2,
				systemWords: [],
			});

			expect(result.type).toBe("Failure");
			if (result.type === "Success") return;
			expect(result.reason).toBe("User already submitted a word");
		});

		it("単語入力フェーズ以外で単語提出すると失敗", () => {
			const users = Array.from({ length: 2 }, (_, i) =>
				User(UserId(crypto.randomUUID()), UserName(`User${i + 1}`)),
			);
			const room = Room(RoomCode("TEST"), users, WaitingPhase());
			const word = SubmittedWord(users[0].id, RoundId(1), Word("激安"));
			const result = decide(room, {
				type: "SubmitWord",
				word,
				systemWords: [],
			});

			expect(result.type).toBe("Failure");
			if (result.type === "Success") return;
			expect(result.reason).toBe("Not in word inputting phase");
		});
	});

	describe("文章提出", () => {
		it("文章を提出できる", () => {
			const users = Array.from({ length: 3 }, (_, i) =>
				User(UserId(crypto.randomUUID()), UserName(`User${i + 1}`)),
			);
			const distributedWords = [Word("激安"), Word("ふにゃふにゃ"), Word("生"), Word("炒め")];
			const room = Room(
				RoomCode("TEST"),
				users,
				SentenceInputPhase(RoundId(1), Topic("テストお題"), distributedWords),
			);
			const sentence = Sentence(users[0].id, RoundId(1), "激安ふにゃふにゃ生炒め");
			const result = decide(room, {
				type: "SubmitSentence",
				sentence,
			});

			expect(result.type).toBe("Success");
			if (result.type === "Failure") return;
			expect(result.events.length).toBe(1);
			expect(result.events[0].type).toBe("SentenceSubmitted");
		});

		it("全員が文章を提出したら AllSentencesSubmitted イベントが発生", () => {
			const users = Array.from({ length: 2 }, (_, i) =>
				User(UserId(crypto.randomUUID()), UserName(`User${i + 1}`)),
			);
			const distributedWords = [Word("激安"), Word("ふにゃふにゃ"), Word("生"), Word("炒め")];
			const sentence1 = Sentence(users[0].id, RoundId(1), "激安ふにゃふにゃ生炒め");
			const room = Room(
				RoomCode("TEST"),
				users,
				SentenceInputPhase(RoundId(1), Topic("テストお題"), distributedWords, [sentence1]),
			);
			const sentence2 = Sentence(users[1].id, RoundId(1), "激安の生肉をふにゃふにゃに炒めたの");
			const result = decide(room, {
				type: "SubmitSentence",
				sentence: sentence2,
			});

			expect(result.type).toBe("Success");
			if (result.type === "Failure") return;
			expect(result.events.length).toBe(2);
			expect(result.events[0].type).toBe("SentenceSubmitted");
			expect(result.events[1].type).toBe("AllSentencesSubmitted");
		});

		it("同じユーザーが2回文章提出すると失敗", () => {
			const users = Array.from({ length: 2 }, (_, i) =>
				User(UserId(crypto.randomUUID()), UserName(`User${i + 1}`)),
			);
			const distributedWords = [Word("激安"), Word("ふにゃふにゃ"), Word("生"), Word("炒め")];
			const sentence1 = Sentence(users[0].id, RoundId(1), "激安ふにゃふにゃ生炒め");
			const room = Room(
				RoomCode("TEST"),
				users,
				SentenceInputPhase(RoundId(1), Topic("テストお題"), distributedWords, [sentence1]),
			);
			const sentence2 = Sentence(users[0].id, RoundId(1), "別の文章");
			const result = decide(room, {
				type: "SubmitSentence",
				sentence: sentence2,
			});

			expect(result.type).toBe("Failure");
			if (result.type === "Success") return;
			expect(result.reason).toBe("User already submitted a sentence");
		});

		it("文章入力フェーズ以外で文章提出すると失敗", () => {
			const users = Array.from({ length: 2 }, (_, i) =>
				User(UserId(crypto.randomUUID()), UserName(`User${i + 1}`)),
			);
			const room = Room(RoomCode("TEST"), users, WaitingPhase());
			const sentence = Sentence(users[0].id, RoundId(1), "激安ふにゃふにゃ生炒め");
			const result = decide(room, {
				type: "SubmitSentence",
				sentence,
			});

			expect(result.type).toBe("Failure");
			if (result.type === "Success") return;
			expect(result.reason).toBe("Not in sentence inputting phase");
		});
	});

	describe("投票", () => {
		it("投票できる", () => {
			const users = Array.from({ length: 3 }, (_, i) =>
				User(UserId(crypto.randomUUID()), UserName(`User${i + 1}`)),
			);
			const room = Room(
				RoomCode("TEST"),
				users,
				VotePhase(RoundId(1), Topic("テストお題")),
			);
			const vote = Vote(users[0].id, RoundId(1), users[1].id);
			const result = decide(room, {
				type: "Vote",
				vote,
			});

			expect(result.type).toBe("Success");
			if (result.type === "Failure") return;
			expect(result.events.length).toBe(1);
			expect(result.events[0].type).toBe("VoteSubmitted");
		});

		it("全員が投票したら RoundEnded イベントが発生", () => {
			const users = Array.from({ length: 2 }, (_, i) =>
				User(UserId(crypto.randomUUID()), UserName(`User${i + 1}`)),
			);
			const vote1 = Vote(users[0].id, RoundId(1), users[1].id);
			const room = Room(
				RoomCode("TEST"),
				users,
				VotePhase(RoundId(1), Topic("テストお題"), [vote1]),
			);
			const vote2 = Vote(users[1].id, RoundId(1), users[0].id);
			const result = decide(room, {
				type: "Vote",
				vote: vote2,
			});

			expect(result.type).toBe("Success");
			if (result.type === "Failure") return;
			expect(result.events.length).toBe(2);
			expect(result.events[0].type).toBe("VoteSubmitted");
			expect(result.events[1].type).toBe("RoundEnded");
		});

		it("同じユーザーが2回投票すると失敗", () => {
			const users = Array.from({ length: 2 }, (_, i) =>
				User(UserId(crypto.randomUUID()), UserName(`User${i + 1}`)),
			);
			const vote1 = Vote(users[0].id, RoundId(1), users[1].id);
			const room = Room(
				RoomCode("TEST"),
				users,
				VotePhase(RoundId(1), Topic("テストお題"), [vote1]),
			);
			const vote2 = Vote(users[0].id, RoundId(1), users[1].id);
			const result = decide(room, {
				type: "Vote",
				vote: vote2,
			});

			expect(result.type).toBe("Failure");
			if (result.type === "Success") return;
			expect(result.reason).toBe("User already submitted a vote");
		});

		it("投票フェーズ以外で投票すると失敗", () => {
			const users = Array.from({ length: 2 }, (_, i) =>
				User(UserId(crypto.randomUUID()), UserName(`User${i + 1}`)),
			);
			const room = Room(RoomCode("TEST"), users, WaitingPhase());
			const vote = Vote(users[0].id, RoundId(1), users[1].id);
			const result = decide(room, {
				type: "Vote",
				vote,
			});

			expect(result.type).toBe("Failure");
			if (result.type === "Success") return;
			expect(result.reason).toBe("Not in voting phase");
		});
	});
});
