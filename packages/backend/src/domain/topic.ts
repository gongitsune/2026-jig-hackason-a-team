import * as topics from "@backend/resources/goals.json";

export class Topic {
	constructor(public readonly text: string) {}

	public static create() {
		const randomIndex = Math.floor(Math.random() * topics.length);
		const topic = topics[randomIndex];

		return new Topic(topic);
	}
}
