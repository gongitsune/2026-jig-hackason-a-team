import { Hono } from "hono";

export { GameDO } from "./gameDO";

const app = new Hono<{ Bindings: CloudflareBindings }>();

app.get("/message", (c) => {
	return c.text("Hello Hono!");
});

export default app;
