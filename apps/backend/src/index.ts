import { Hono } from "hono";

import { RoomCode } from "./domain/models/entities/room";

export { GameDO } from "./gameDO";

const app = new Hono<{ Bindings: CloudflareBindings }>();

app.get("/health", () => new Response("OK"));

app.get("/ws/:roomCode", (c) => {
	const upgradeHeader = c.req.header("Upgrade");
	if (!upgradeHeader || upgradeHeader !== "websocket") {
		return new Response("Expected Upgrade: websocket", { status: 426 });
	}

	const { roomCode } = c.req.param();
	const stub = c.env.GAME_DO.getByName(roomCode);
	stub.setRoomCode(RoomCode(roomCode));

	return stub.fetch(c.req.raw);
});

export default app;
