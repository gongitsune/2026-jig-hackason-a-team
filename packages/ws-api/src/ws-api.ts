import * as v from "valibot";

const ClientCommandSchema = v.variant("type", [
	v.object({
		type: v.literal("JoinUser"),
		userId: v.string(),
		userName: v.string(),
	}),
	v.object({
		type: v.literal("StartGame"),
	}),
	v.object({
		type: v.literal("SubmitWord"),
		word: v.string(),
	}),
	v.object({
		type: v.literal("SubmitSentence"),
		sentence: v.string(),
	}),
	v.object({
		type: v.literal("Vote"),
		targetUserId: v.string(),
	}),
]);

const ResultSchema = v.object({
	roundNumber: v.number(),
	topic: v.string(),
	results: v.array(
		v.object({
			userName: v.string(),
			sentence: v.string(),
			voteCount: v.number(),
		}),
	),
});
const ClientEventSchema = v.variant("type", [
	v.object({
		type: v.literal("RoomJoined"),
		room: v.object({
			users: v.array(
				v.object({
					name: v.string(),
				}),
			),
			lastResult: v.optional(ResultSchema),
		}),
	}),
	v.object({
		type: v.literal("UserUpdated"),
		users: v.array(
			v.object({
				name: v.string(),
			}),
		),
	}),
	v.object({
		type: v.literal("GameStarted"),
		topic: v.string(),
	}),
	v.object({
		type: v.literal("SentenceInputting"),
		distributedWords: v.array(v.string()),
	}),
	v.object({
		type: v.literal("Voting"),
		sentences: v.array(
			v.object({
				userId: v.string(),
				sentence: v.string(),
			}),
		),
	}),
	v.object({
		type: v.literal("GameEnded"),
		result: ResultSchema,
	}),
	v.object({
		type: v.literal("Error"),
		message: v.string(),
	}),
]);

export type ClientCommand = v.InferInput<typeof ClientCommandSchema>;
export type ClientEvent = v.InferOutput<typeof ClientEventSchema>;

export const ClientCommand = (data: unknown): ClientCommand => v.parse(ClientCommandSchema, data);
export const ClientEvent = (data: unknown): ClientEvent => v.parse(ClientEventSchema, data);
