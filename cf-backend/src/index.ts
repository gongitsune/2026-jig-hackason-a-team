import { DurableObject } from "cloudflare:workers";

export class AppDurableObject extends DurableObject<Env> {
	constructor(ctx: DurableObjectState, env: Env) {
		super(ctx, env);
	}

	async sayHello(name: string): Promise<string> {
		return `Hello, ${name}!`;
	}
}

export default {
	async fetch(_request, env, _ctx): Promise<Response> {
		const stub = env.APP_DURABLE_OBJECT.getByName("foo");

		const greeting = await stub.sayHello("world");

		return new Response(greeting);
	},
} satisfies ExportedHandler<Env>;
