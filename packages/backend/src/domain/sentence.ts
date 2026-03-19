import { SentenceSchema } from "@ichibun/shared/schemas/sentence";
import * as v from "valibot";

import { User } from "./user";

export class Sentence {
	constructor(
		public readonly user: User,
		public readonly sentence: string,
		public readonly roundId: number,
	) {}

	public static create(user: User, sentence: string, roundId: number): Sentence {
		v.assert(SentenceSchema, sentence);

		return new Sentence(user, sentence, roundId);
	}
}
