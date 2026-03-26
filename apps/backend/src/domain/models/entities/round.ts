import * as v from "valibot";

import { Topic, TopicSchema } from "../values/topic";

export const RoundIdSchema = v.pipe(v.string(), v.brand("RoundId"));
export const RoundStatusList = ["Waiting", "WordInputting", "SentenceInputting", "Voting"] as const;
export const RoundStatusSchema = v.pipe(v.picklist(RoundStatusList), v.brand("RoundStatus"));
export const RoundSchema = v.pipe(
	v.object({
		id: RoundIdSchema,
		roundNumber: v.pipe(v.number(), v.minValue(1)),
		topic: TopicSchema,
	}),
	v.readonly(),
	v.brand("Round"),
);

export type RoundId = v.InferOutput<typeof RoundIdSchema>;
export type RoundStatus = v.InferOutput<typeof RoundStatusSchema>;
export type Round = v.InferOutput<typeof RoundSchema>;

export const RoundId = (id: string) => v.parse(RoundIdSchema, id);
export const RoundStatus = (status: (typeof RoundStatusList)[number]) =>
	v.parse(RoundStatusSchema, status);
export const Round = (id: RoundId, roundNumber: number, topic: Topic) =>
	v.parse(RoundSchema, { id, roundNumber, topic });
