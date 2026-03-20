import { PublicAPI } from "@ichibun/shared/api";
import { newWebSocketRpcSession } from "capnweb";
import { env } from "cloudflare:workers";
import { describe, expect, it } from "vitest";

describe("Game", () => {
	it("healthcheck", async () => {
		console.log("Fetching WebSocket...");
		const resp = await (<any>env).testServer.fetch("http://example.com/room/test-phrase", {
			headers: { Upgrade: "websocket" },
		});
		console.log("Response received");
		const ws: WebSocket | undefined = resp.webSocket;
		expect(ws).toBeTruthy();

		console.log("Accepting WebSocket...");
		ws!.accept();
		console.log("WebSocket accepted");

		// WebSocketが準備完了するまで少し待つ
		await new Promise(resolve => setTimeout(resolve, 100));

		console.log("Creating RPC session...");
		const cap = newWebSocketRpcSession<PublicAPI>(ws!);
		console.log("RPC session created");
		console.log("Calling healthCheck...");
		const result = await cap.healthCheck();
		console.log("healthCheck returned:", result);
		expect(result).toBe("OK");
	});
});
