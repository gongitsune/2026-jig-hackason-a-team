import * as v from "valibot";

import { Sentence, SentenceSchema } from "../entities/sentence";
import { User, UserSchema } from "../entities/user";
import { Topic, TopicSchema } from "./topic";

export const UserResultSchema = v.pipe(
	v.object({
		user: UserSchema,
		sentence: SentenceSchema,
		voteCount: v.number(),
	}),
	v.readonly(),
	v.brand("UserResult"),
);
export const GameResultSchema = v.pipe(
	v.object({
		roundNumber: v.number(),
		topic: TopicSchema,
		results: v.array(UserResultSchema),
	}),
	v.readonly(),
	v.brand("GameResult"),
);

export type UserResult = v.InferOutput<typeof UserResultSchema>;
export type GameResult = v.InferOutput<typeof GameResultSchema>;

export const UserResult = (
	user: User,
	sentence: Sentence,
	voteCount: UserResult["voteCount"],
): UserResult => {
	return v.parse(UserResultSchema, { user, sentence, voteCount });
};

export const GameResult = (
	roundNumber: number,
	topic: Topic,
	results: UserResult[],
): GameResult => {
	return v.parse(GameResultSchema, { roundNumber, topic, results });
};
