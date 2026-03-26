import assert from "assert";

import { ClientCommand, ClientEvent } from "@ichibun/ws-api";
import { DurableObject } from "cloudflare:workers";
import { drizzle, DrizzleSqliteDODatabase } from "drizzle-orm/durable-sqlite";
import { migrate } from "drizzle-orm/durable-sqlite/migrator";
import { HTTPException } from "hono/http-exception";

import migrations from "../drizzle/migrations";
import { IdGenerator } from "./application/service/id-generator";
import { TopicService } from "./application/service/topic-service";
import {
	JoinUseCase,
	LeaveUseCase,
	StartGameUseCase,
	SubmitSentenceUseCase,
	SubmitWordUseCase,
	VoteUseCase,
} from "./application/usecase/room";
import { RoomCode } from "./domain/models/entities/room";
import { User, UserId, UserName } from "./domain/models/entities/user";
import { Word } from "./domain/models/entities/word";
import { makeRoomRepository, RoomRepository } from "./domain/repositories/room-repository";
import { makeUserRepository, UserRepository } from "./domain/repositories/user-repository";

export class GameDO extends DurableObject {
	private storage: DurableObjectStorage;
	private db: DrizzleSqliteDODatabase;
	private deps: {
		roomRepo: RoomRepository;
		userRepo: UserRepository;
		idGenerator: IdGenerator;
		topicService: TopicService;
	};
	private sessions: Map<WebSocket, { userId: string }>;
	private roomCode?: RoomCode;

	constructor(state: DurableObjectState, env: Cloudflare.Env) {
		super(state, env);
		this.sessions = new Map();

		this.ctx.getWebSockets().forEach((ws) => {
			let attachment = ws.deserializeAttachment();
			if (attachment) {
				this.sessions.set(ws, { ...attachment });
			}
		});

		this.storage = state.storage;
		this.db = drizzle(this.storage, { logger: false });

		this.deps = {
			roomRepo: makeRoomRepository(this.db),
			userRepo: makeUserRepository(this.db),
			idGenerator: IdGenerator(),
			topicService: TopicService(),
		};

		this.migrate();

		this.ctx.setWebSocketAutoResponse(new WebSocketRequestResponsePair("ping", "pong"));
	}

	fetch(request: Request): Response | Promise<Response> {
		const webSocketPair = new WebSocketPair();
		const [client, server] = Object.values(webSocketPair);

		const url = new URL(request.url);
		const userId = url.searchParams.get("userId");
		if (!userId) throw new HTTPException(400, { message: "Missing userId in query parameters" });

		this.ctx.acceptWebSocket(server);

		server.serializeAttachment({ userId });
		this.sessions.set(server, { userId });

		return new Response(null, {
			status: 101,
			webSocket: client,
		});
	}

	setRoomCode(roomCode: RoomCode) {
		this.roomCode = roomCode;
	}

	// eslint-disable-next-line eslint/max-lines-per-function
	webSocketMessage(ws: WebSocket, message: string | ArrayBuffer): void | Promise<void> {
		const session = this.sessions.get(ws);
		assert(session, "Session not found for WebSocket");
		assert(this.roomCode, "Room code is not set");

		if (typeof message !== "string") return;

		const event = ClientCommand(JSON.parse(message));
		switch (event.type) {
			case "JoinUser": {
				const uc = JoinUseCase(this.deps);
				const res = uc({
					roomCode: this.roomCode,
					user: User(UserId(event.userId), UserName(event.userName)),
				});
				if (res.ok) {
					let lastResult:
						| Extract<ClientEvent, { type: "RoomJoined" }>["room"]["lastResult"]
						| undefined = undefined;
					if (res.data.result) {
						lastResult = {
							roundNumber: res.data.result.roundNumber,
							topic: res.data.result.topic,
							results: res.data.result.results.map((r) => ({
								userName: r.user.name,
								sentence: r.sentence.text,
								voteCount: r.voteCount,
							})),
						};
					}
					this.sendToClient(ws, {
						type: "RoomJoined",
						room: {
							users: res.data.users.map((u) => ({
								name: u.name,
							})),
							lastResult,
						},
					});
					this.sendToAll(
						{
							type: "UserUpdated",
							users: res.data.users.map((u) => ({
								name: u.name,
							})),
						},
						ws,
					);
				} else {
					this.sendToClient(ws, {
						type: "Error",
						message: `Failed to join room: ${res.error}`,
					});
				}
				break;
			}
			case "StartGame": {
				const uc = StartGameUseCase(this.deps);
				const res = uc(this.roomCode);
				if (res.ok) {
					this.sendToAll({
						type: "GameStarted",
						topic: res.data.topic,
					});
				} else {
					this.sendToClient(ws, {
						type: "Error",
						message: `Failed to start game: ${res.error}`,
					});
				}
				break;
			}
			case "SubmitWord": {
				const uc = SubmitWordUseCase(this.deps);
				const res = uc({
					roomCode: this.roomCode,
					userId: UserId(session.userId),
					word: Word(event.word),
				});
				if (res.ok) {
					if (res.data.phaseChanged)
						this.sendToAll({
							type: "SentenceInputting",
							distributedWords: res.data.distributedWords,
						});
				} else {
					this.sendToClient(ws, {
						type: "Error",
						message: `Failed to submit word: ${res.error}`,
					});
				}
				break;
			}
			case "SubmitSentence": {
				const uc = SubmitSentenceUseCase(this.deps);
				const res = uc({
					roomCode: this.roomCode,
					userId: UserId(session.userId),
					sentence: event.sentence,
				});
				if (res.ok) {
					if (res.data.phaseChanged) {
						const sentences = res.data.sentences.map((s) => ({
							userId: s.writerId,
							sentence: s.text,
						}));
						this.sessions.forEach(({ userId }, client) => {
							this.sendToClient(client, {
								type: "Voting",
								sentences: sentences.filter((s) => s.userId !== userId),
							});
						});
					}
				} else {
					this.sendToClient(ws, {
						type: "Error",
						message: `Failed to submit sentence: ${res.error}`,
					});
				}
				break;
			}
			case "Vote": {
				const uc = VoteUseCase(this.deps);
				const res = uc({
					roomCode: this.roomCode,
					userId: UserId(session.userId),
					targetUserId: UserId(event.targetUserId),
				});

				if (res.ok) {
					if (res.data.phaseChanged) {
						const result = res.data.result;

						this.sendToAll({
							type: "GameEnded",
							result: {
								roundNumber: result.roundNumber,
								topic: result.topic,
								results: result.results.map((r) => ({
									userName: r.user.name,
									sentence: r.sentence.text,
									voteCount: r.voteCount,
								})),
							},
						});
					}
				} else {
					this.sendToClient(ws, {
						type: "Error",
						message: `Failed to submit vote: ${res.error}`,
					});
				}
				break;
			}
		}
	}

	webSocketClose(
		ws: WebSocket,
		code: number,
		reason: string,
		_wasClean: boolean,
	): void | Promise<void> {
		ws.close(code, reason);

		const session = this.sessions.get(ws);
		if (!session) return;

		this.sessions.delete(ws);

		assert(this.roomCode, "Room code is not set");

		const uc = LeaveUseCase(this.deps);
		const res = uc({
			roomCode: this.roomCode,
			userId: UserId(session.userId),
		});
		if (res.ok) {
			if (res.data.users.length === 0) {
				this.storage.deleteAll();
				return;
			}

			this.sendToAll({
				type: "UserUpdated",
				users: res.data.users.map((u) => ({
					name: u.name,
				})),
			});
		} else {
			throw new Error(`Failed to leave room: ${res.error}`);
		}
	}

	private migrate() {
		migrate(this.db, migrations);
	}

	private sendToClient(ws: WebSocket, event: ClientEvent) {
		const message = JSON.stringify(event);
		ws.send(message);
	}

	private sendToAll(event: ClientEvent, excludeWs?: WebSocket) {
		const message = JSON.stringify(event);
		this.sessions.forEach((_, client) => {
			if (client !== excludeWs) client.send(message);
		});
	}
}
