import { newWebSocketRpcSession } from "capnweb";
import { DurableObject } from "cloudflare:workers";
import { drizzle, DrizzleSqliteDODatabase } from "drizzle-orm/durable-sqlite";
import { migrate } from "drizzle-orm/durable-sqlite/migrator";

import migrations from "../drizzle/migrations";
import { PublicApiImpl } from "./controller/publicApi";
import { relations } from "./db/relations";
import { AppState } from "./state";

export class GameDO extends DurableObject<Env> {
	private storage: DurableObjectStorage;
	private db: DrizzleSqliteDODatabase<any>;
	private sessions: Map<WebSocket, { [key: string]: string }>;
	public readonly state: AppState;

	constructor(ctx: DurableObjectState, env: Env) {
		super(ctx, env);

		this.storage = ctx.storage;
		this.db = drizzle(this.storage, { logger: false, relations });

		this.sessions = new Map();

		this.state = new AppState(this.db);

		this.ctx.getWebSockets().forEach((ws) => {
			let attachment = ws.deserializeAttachment();
			if (attachment) {
				this.sessions.set(ws, { ...attachment });
			}
		});

		this.ctx.setWebSocketAutoResponse(new WebSocketRequestResponsePair("ping", "pong"));

		this.migrate();
	}

	fetch(_request: Request): Response {
		const webSocketPair = new WebSocketPair();
		const [client, server] = Object.values(webSocketPair);

		this.ctx.acceptWebSocket(server);

		const id = crypto.randomUUID();
		server.serializeAttachment({ id });

		this.sessions.set(server, { id });

		// capnwebのセッションを開始
		newWebSocketRpcSession(server, new PublicApiImpl(this.state));

		return new Response(null, {
			status: 101,
			webSocket: client,
		});
	}

	webSocketClose(ws: WebSocket, code: number, reason: string, _wasClean: boolean) {
		ws.close(code, reason);
		this.sessions.delete(ws);
	}

	webSocketMessage(ws: WebSocket, message: string | ArrayBuffer): void | Promise<void> {
		const state = ws.deserializeAttachment() as { id: string };
	}

	webSocketError(ws: WebSocket, error: unknown): void | Promise<void> {}

	private migrate() {
		migrate(this.db, migrations);
	}
}

export default {
	fetch(request, env, _ctx): Promise<Response> {
		const url = new URL(request.url);
		const pattern = new URLPattern({ pathname: "/room/:passphrase" });

		const match = pattern.exec(url);
		if (match) {
			const { passphrase } = match.pathname.groups;

			const stub = env.GAME_DO.getByName(passphrase);
			return stub.fetch(request);
		}

		return Promise.resolve(
			new Response(null, {
				status: 404,
			}),
		);
	},
} satisfies ExportedHandler<Env>;
