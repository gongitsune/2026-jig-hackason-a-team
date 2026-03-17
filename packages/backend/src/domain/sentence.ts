import * as v from "valibot";
import { UserIdSchema } from "@ichibun/shared/schemas/user";
import { SentenceSchema } from "@ichibun/shared/schemas/sentence";

export class Sentence {
	constructor(
		public readonly userId: string,
		public readonly sentence: string,
	) {}

	public static create(userId: string, sentence: string): Sentence {
		v.assert(UserIdSchema, userId);
		v.assert(SentenceSchema, sentence);

		return new Sentence(userId, sentence);
	}
}
