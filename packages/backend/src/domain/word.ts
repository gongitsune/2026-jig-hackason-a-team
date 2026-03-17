import { WordSchema } from "@ichibun/shared/schemas/word";
import * as v from "valibot";

export class Word {
	constructor(public readonly word: string) {}

	public static create(word: string): Word {
		v.assert(WordSchema, word);

		return new Word(word);
	}
}
