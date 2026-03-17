import { DurableObject } from "cloudflare:workers";

export class AppDurableObject extends DurableObject<Env> {
	constructor(ctx: DurableObjectState, env: Env) {
		super(ctx, env);
	}
}

export default {
	async fetch(_request, _env, _ctx): Promise<Response> {
		return new Response();
	},
} satisfies ExportedHandler<Env>;
