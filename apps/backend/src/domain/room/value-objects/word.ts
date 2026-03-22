import * as v from "valibot";

import { UserId, UserIdSchema } from "../../user/user";
import { RoundId, RoundIdSchema } from "./round";

export const WordSchema = v.pipe(v.string(), v.minLength(1), v.maxLength(10), v.brand("Word"));
export const SubmittedWordSchema = v.pipe(
	v.object({
		writerId: UserIdSchema,
		roundId: RoundIdSchema,
		word: WordSchema,
	}),
	v.brand("SubmittedWord"),
);

export type Word = v.InferOutput<typeof WordSchema>;
export type SubmittedWord = v.InferOutput<typeof SubmittedWordSchema>;

export const Word = (text: string): Word => v.parse(WordSchema, text);
export const SubmittedWord = (writerId: UserId, roundId: RoundId, word: Word) =>
	v.parse(SubmittedWordSchema, {
		writerId,
		roundId,
		word,
	});
