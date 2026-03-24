import * as v from "valibot";

export const TopicSchema = v.pipe(v.string(), v.minLength(1), v.maxLength(100), v.brand("Topic"));

export type Topic = v.InferOutput<typeof TopicSchema>;

export const Topic = (topic: string): Topic => {
	return v.parse(TopicSchema, topic);
};
