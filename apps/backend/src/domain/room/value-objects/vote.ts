import * as v from "valibot";

import { UserId, UserIdSchema } from "../../user/user";
import { RoundId, RoundIdSchema } from "./round";

export const VoteSchema = v.pipe(
	v.object({
		voterId: UserIdSchema,
		roundId: RoundIdSchema,
		targetId: UserIdSchema,
	}),
	v.readonly(),
	v.brand("Vote"),
);

export type Vote = v.InferOutput<typeof VoteSchema>;

export const Vote = (voterId: UserId, roundId: RoundId, targetId: UserId): Vote => {
	return v.parse(VoteSchema, { voterId, roundId, targetId });
};
