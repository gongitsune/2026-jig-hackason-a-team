import { DurableObject } from "cloudflare:workers";
import { drizzle, DrizzleSqliteDODatabase } from "drizzle-orm/durable-sqlite";
import { migrate } from "drizzle-orm/durable-sqlite/migrator";

import migrations from "../drizzle/migrations";

export class GameDO extends DurableObject<Cloudflare.Env> {
	private storage: DurableObjectStorage;
	private db: DrizzleSqliteDODatabase;

	constructor(state: DurableObjectState, env: Cloudflare.Env) {
		super(state, env);

		this.storage = state.storage;
		this.db = drizzle(this.storage, { logger: false });

		this.migrate();
	}

	fetch(_request: Request): Response | Promise<Response> {
		const webSocketPair = new WebSocketPair();
		const [client, server] = Object.values(webSocketPair);

		this.ctx.acceptWebSocket(server);

		return new Response(null, {
			status: 101,
			webSocket: client,
		});
	}

	webSocketMessage(ws: WebSocket, message: string | ArrayBuffer): void | Promise<void> {
		ws.send(
			`[Durable Object] message: ${message}, connections: ${this.ctx.getWebSockets().length}`,
		);
	}

	webSocketClose(
		ws: WebSocket,
		code: number,
		reason: string,
		_wasClean: boolean,
	): void | Promise<void> {
		ws.close(code, reason);
	}

	private migrate() {
		migrate(this.db, migrations);
	}

	// ===== Logic RPC methods =====
}
