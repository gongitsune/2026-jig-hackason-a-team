import { ClientCommand, ClientEvent } from "@ichibun/ws-api";
import { env } from "cloudflare:workers";
import { nanoid } from "nanoid";
import { describe, expect, it } from "vitest";

import app from "../src";

const sendCommand = async (ws: WebSocket, command: ClientCommand, delay: number = 10) => {
	ws.send(JSON.stringify(command));
	await new Promise((resolve) => {
		setTimeout(resolve, delay);
	});
};

const waitExpectEvents = (
	ws: WebSocket,
	events: ClientEvent[],
	timeout = 1000,
): Promise<ClientEvent> => {
	const eventQueue = [...events];

	return new Promise((resolve, reject) => {
		const listener = (event: MessageEvent) => {
			try {
				const data = JSON.parse(event.data);
				const clientEvent = ClientEvent(data);
				expect(clientEvent).toEqual(eventQueue[0]);

				eventQueue.shift();

				if (eventQueue.length === 0) {
					ws.removeEventListener("message", listener);
					resolve(clientEvent);
				}
			} catch (err) {
				reject(err);
			}
		};

		ws.addEventListener("message", listener);

		setTimeout(() => {
			ws.removeEventListener("message", listener);
			reject(new Error("Timeout waiting for event"));
		}, timeout);
	});
};

const makeWebSocket = async (roomCode: string, userId: string) => {
	const res = await app.request(
		`/ws/${roomCode}?userId=${userId}`,
		{
			headers: {
				Upgrade: "websocket",
			},
		},
		env,
	);

	expect(res.status).toBe(101);
	expect(res.webSocket).toBeDefined();

	const ws = res.webSocket!;
	ws.accept();

	return ws;
};

const joinUser = (ws: WebSocket, userId: string, userName: string) => {
	return sendCommand(ws, {
		type: "JoinUser",
		userId,
		userName,
	});
};

describe("ヘルスチェック", () => {
	it("正常に応答する", async () => {
		const res = await app.request("/health", {}, env);

		expect(res.status).toBe(200);
		expect(await res.text()).toBe("OK");
	});
});

describe("Integrate", () => {
	it("ラウンドを一通り", async () => {
		const roomCode = nanoid(6);
		const userId1 = "566a534e-743f-434a-9fc0-c87135db7236";
		const userId2 = "5b115ec4-540c-49b9-a018-1767b585843a";

		const ws1 = await makeWebSocket(roomCode, userId1);
		const ws2 = await makeWebSocket(roomCode, userId2);

		const eventPromise = Promise.all([
			waitExpectEvents(ws1, [
				{
					type: "RoomJoined",
					room: { users: [{ name: "User1" }] },
				},
				{
					type: "UserUpdated",
					users: [{ name: "User1" }, { name: "User2" }],
				},
				{ type: "GameStarted", topic: expect.any(String) },
				{ type: "SentenceInputting", distributedWords: expect.any(Array) },
				{ type: "Voting", sentences: [{ userId: userId2, sentence: "びちゃびちゃの犬" }] },
				{
					type: "GameEnded",
					result: {
						roundNumber: 1,
						topic: expect.any(String),
						results: [
							{ userName: "User1", voteCount: 1, sentence: "ふにゃふにゃの猫" },
							{ userName: "User2", voteCount: 1, sentence: "びちゃびちゃの犬" },
						],
					},
				},
				{ type: "GameStarted", topic: expect.any(String) },
			]),
			waitExpectEvents(ws2, [
				{
					type: "UserUpdated",
					users: [{ name: "User1" }],
				},
				{
					type: "RoomJoined",
					room: { users: [{ name: "User1" }, { name: "User2" }] },
				},
				{ type: "GameStarted", topic: expect.any(String) },
				{ type: "SentenceInputting", distributedWords: expect.any(Array) },
				{ type: "Voting", sentences: [{ userId: userId1, sentence: "ふにゃふにゃの猫" }] },
				{
					type: "GameEnded",
					result: {
						roundNumber: 1,
						topic: expect.any(String),
						results: [
							{ userName: "User1", voteCount: 1, sentence: "ふにゃふにゃの猫" },
							{ userName: "User2", voteCount: 1, sentence: "びちゃびちゃの犬" },
						],
					},
				},
				{ type: "GameStarted", topic: expect.any(String) },
			]),
		]);

		await joinUser(ws1, userId1, "User1");
		await joinUser(ws2, userId2, "User2");

		await sendCommand(ws1, { type: "StartGame" });

		await sendCommand(ws1, { type: "SubmitWord", word: "ふにゃふにゃ" });
		await sendCommand(ws2, { type: "SubmitWord", word: "びちゃびちゃ" });

		await sendCommand(ws1, { type: "SubmitSentence", sentence: "ふにゃふにゃの猫" });
		await sendCommand(ws2, { type: "SubmitSentence", sentence: "びちゃびちゃの犬" });

		await sendCommand(ws1, { type: "Vote", targetUserId: userId2 });
		await sendCommand(ws2, { type: "Vote", targetUserId: userId1 });

		await sendCommand(ws1, { type: "StartGame" });

		await eventPromise;
	});
});
