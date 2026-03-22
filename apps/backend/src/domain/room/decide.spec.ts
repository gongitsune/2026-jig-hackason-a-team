import { describe, expect, it } from "vitest";

import { User, UserId, UserName } from "../user/user";
import { decide } from "./decide";
import { WaitingPhase } from "./value-objects/game-phase";
import { Room, RoomCode } from "./value-objects/room";
import { RoundId } from "./value-objects/round";
import { Topic } from "./value-objects/topic";

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
});
