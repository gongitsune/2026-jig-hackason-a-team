import * as v from "valibot";

import { Sentence, SentenceSchema } from "../entities/sentence";
import { User, UserId, UserSchema } from "../entities/user";
import { Vote } from "../entities/vote";
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

export const aggregateGameResult = (
	roundNumber: number,
	topic: Topic,
	sentences: Sentence[],
	users: User[],
	votes: Vote[],
): GameResult => {
	const voteCntByUserId: Record<UserId, number> = {};
	votes.forEach((vote) => {
		voteCntByUserId[vote.targetId]++;
	});

	const sentencesByUserId: Record<UserId, Sentence> = {};
	sentences.forEach((sentence) => {
		sentencesByUserId[sentence.writerId] = sentence;
	});

	const results = users.map((user) => {
		const sentence = sentencesByUserId[user.id];
		const voteCount = voteCntByUserId[user.id] || 0;
		return UserResult(user, sentence, voteCount);
	});

	return GameResult(roundNumber, topic, results);
};
