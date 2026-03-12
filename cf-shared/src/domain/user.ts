import * as v from "valibot";

export const userIdSchema = v.pipe(v.string(), v.uuid());
export type UserId = v.InferInput<typeof userIdSchema>;
