import { Topic } from "../../domain/models/values/topic";
import { loadTopics } from "../../domain/repositories/room-repository";

export type TopicService = {
	pickRandom: () => Topic;
};
export const TopicService = (): TopicService => ({
	pickRandom: () => {
		const topics = loadTopics();
		const randomIndex = Math.floor(Math.random() * topics.length);
		return Topic(topics[randomIndex]);
	},
});
