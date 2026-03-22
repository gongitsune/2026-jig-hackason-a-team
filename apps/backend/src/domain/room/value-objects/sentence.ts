import * as v from "valibot";

import { UserId, UserIdSchema } from "../../user/user";
import { RoundId, RoundIdSchema } from "./round";

export const SentenceSchema = v.pipe(
	v.object({
		writerId: UserIdSchema,
		roundId: RoundIdSchema,
		text: v.pipe(v.string(), v.minLength(1), v.maxLength(30)),
	}),
	v.brand("Sentence"),
);

export type Sentence = v.InferOutput<typeof SentenceSchema>;

export const Sentence = (writerId: UserId, roundId: RoundId, text: string): Sentence =>
	v.parse(SentenceSchema, { writerId, roundId, text });
