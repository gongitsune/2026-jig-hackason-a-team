import { UserIdSchema } from "@ichibun/shared/schemas/user";
import * as v from "valibot";

export class Vote {
	constructor(
		public readonly userId: string,
		public readonly sentenceId: number,
		public readonly roundId: number,
	) {}

	public static create(userId: string, sentenceId: number, roundId: number): Vote {
		v.assert(UserIdSchema, userId);
		return new Vote(userId, sentenceId, roundId);
	}
}
