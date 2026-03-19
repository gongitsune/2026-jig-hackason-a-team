import { Hono } from "hono";
import { DurableObject } from "cloudflare:workers";
import { drizzle, DrizzleSqliteDODatabase } from "drizzle-orm/durable-sqlite";
import { migrate } from "drizzle-orm/durable-sqlite/migrator";

import migrations from "../drizzle/migrations";
import { relations } from "./db/relations";
import { AppState } from "./state";
import { createRoomRouter } from "./routes/room";

export class GameDO extends DurableObject<Env> {
	private storage: DurableObjectStorage;
	private db: DrizzleSqliteDODatabase<any>;
	private app: Hono;
	private subscriptions: Set<WebSocket>;
	public readonly state: AppState;

	constructor(ctx: DurableObjectState, env: Env) {
		super(ctx, env);

		this.storage = ctx.storage;
		this.db = drizzle(this.storage, { logger: false, relations });
		this.subscriptions = new Set();
		this.state = new AppState(this.db);

		this.app = new Hono();
		this.app.route("/", createRoomRouter(this.state));

		this.ctx.setWebSocketAutoResponse(new WebSocketRequestResponsePair("ping", "pong"));
		this.migrate();
	}

	fetch(request: Request): Promise<Response> | Response {
		return this.app.fetch(request);
	}

	webSocketMessage(_ws: WebSocket, _data: ArrayBuffer | string) {
		// Handle WebSocket messages for subscriptions
		// This will be used for real-time updates
	}

	webSocketClose(ws: WebSocket, code: number, reason: string, _wasClean: boolean) {
		ws.close(code, reason);
		this.subscriptions.delete(ws);
	}

	private migrate() {
		migrate(this.db, migrations);
	}
}

export default {
	fetch(request: Request, env: Env, _ctx: ExecutionContext): Promise<Response> {
		const url = new URL(request.url);
		const pattern = new URLPattern("/room/:passphrase/*");

		const match = pattern.exec(url);
		if (match) {
			const { passphrase } = match.pathname.groups;
			const stub = env.GAME_DO.getByName(passphrase);
			return stub.fetch(request);
		}

		return Promise.resolve(
			new Response(JSON.stringify({ error: "Not found" }), {
				status: 404,
				headers: { "Content-Type": "application/json" },
			}),
		);
	},
} satisfies ExportedHandler<Env>;
