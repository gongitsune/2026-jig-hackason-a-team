import { UserIdSchema } from "@ichibun/shared/schemas/user";
import { WordSchema } from "@ichibun/shared/schemas/word";
import * as v from "valibot";

export type Word = SystemWord | UserWord;

export class SystemWord {
	constructor(public readonly word: string) {}

	public static create(word: string): SystemWord {
		v.assert(WordSchema, word);

		return new SystemWord(word);
	}
}

export class UserWord {
	constructor(
		public readonly word: string,
		public readonly userId: string,
		public readonly roundId: number,
	) {}

	public static create(word: string, userId: string, roundId: number): UserWord {
		v.assert(WordSchema, word);
		v.assert(UserIdSchema, userId);
		v.assert(v.pipe(v.number(), v.integer(), v.minValue(0)), roundId);

		return new UserWord(word, userId, roundId);
	}
}
