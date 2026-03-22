import * as v from "valibot";

import { GameResult, GameResultSchema } from "./game-result";
import { RoundId, RoundIdSchema, RoundStatusList } from "./round";
import { Sentence, SentenceSchema } from "./sentence";
import { Topic, TopicSchema } from "./topic";
import { Vote, VoteSchema } from "./vote";
import { SubmittedWord, SubmittedWordSchema, Word, WordSchema } from "./word";

export const WaitingPhaseSchema = v.pipe(
	v.object({
		tag: v.literal(RoundStatusList["0"]),
		lastResult: v.optional(GameResultSchema),
	}),
	v.readonly(),
);
export const WordInputPhaseSchema = v.pipe(
	v.object({
		tag: v.literal(RoundStatusList["1"]),
		roundId: RoundIdSchema,
		topic: TopicSchema,
		submitted: v.array(SubmittedWordSchema),
	}),
	v.readonly(),
);
export const SentenceInputPhaseSchema = v.pipe(
	v.object({
		tag: v.literal(RoundStatusList["2"]),
		roundId: RoundIdSchema,
		topic: TopicSchema,
		distributedWords: v.array(WordSchema),
		submitted: v.array(SentenceSchema),
	}),
	v.readonly(),
);
export const VotePhaseSchema = v.pipe(
	v.object({
		tag: v.literal(RoundStatusList["3"]),
		roundId: RoundIdSchema,
		topic: TopicSchema,
		submitted: v.array(VoteSchema),
	}),
	v.readonly(),
);
export const ResultPhaseSchema = v.pipe(
	v.object({
		tag: v.literal(RoundStatusList["4"]),
	}),
	v.readonly(),
);
export const GamePhaseSchema = v.variant("tag", [
	WaitingPhaseSchema,
	WordInputPhaseSchema,
	SentenceInputPhaseSchema,
	VotePhaseSchema,
	ResultPhaseSchema,
]);

export type WaitingPhase = v.InferOutput<typeof WaitingPhaseSchema>;
export type WordInputPhase = v.InferOutput<typeof WordInputPhaseSchema>;
export type SentenceInputPhase = v.InferOutput<typeof SentenceInputPhaseSchema>;
export type VotePhase = v.InferOutput<typeof VotePhaseSchema>;
export type ResultPhase = v.InferOutput<typeof ResultPhaseSchema>;
export type GamePhase = v.InferOutput<typeof GamePhaseSchema>;

export const WaitingPhase = (lastResult?: GameResult): WaitingPhase =>
	v.parse(WaitingPhaseSchema, {
		tag: RoundStatusList["0"],
		lastResult,
	});

export const WordInputPhase = (
	roundId: RoundId,
	topic: Topic,
	submitted: SubmittedWord[] = [],
): WordInputPhase =>
	v.parse(WordInputPhaseSchema, {
		tag: RoundStatusList["1"],
		roundId,
		topic,
		submitted,
	});
export const addWordToWordInputPhase = (
	phase: WordInputPhase,
	word: SubmittedWord,
): WordInputPhase =>
	v.parse(WordInputPhaseSchema, {
		...phase,
		submitted: [...phase.submitted, word],
	});

export const SentenceInputPhase = (
	roundId: RoundId,
	topic: Topic,
	distributedWords: Word[],
	submitted: Sentence[] = [],
): SentenceInputPhase =>
	v.parse(SentenceInputPhaseSchema, {
		tag: RoundStatusList["2"],
		roundId,
		topic,
		distributedWords,
		submitted,
	});
export const addSentenceToSentenceInputPhase = (
	phase: SentenceInputPhase,
	sentence: Sentence,
): SentenceInputPhase =>
	v.parse(SentenceInputPhaseSchema, {
		...phase,
		submitted: [...phase.submitted, sentence],
	});

export const VotePhase = (roundId: RoundId, topic: Topic, submitted: Vote[] = []): VotePhase =>
	v.parse(VotePhaseSchema, {
		tag: RoundStatusList["3"],
		roundId,
		topic,
		submitted,
	});
export const addVoteToVotePhase = (phase: VotePhase, vote: Vote): VotePhase =>
	v.parse(VotePhaseSchema, {
		...phase,
		submitted: [...phase.submitted, vote],
	});

export const ResultPhase = (): ResultPhase =>
	v.parse(ResultPhaseSchema, {
		tag: RoundStatusList["4"],
	});
