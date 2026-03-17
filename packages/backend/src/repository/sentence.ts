import { SentenceSchema } from "@ichibun/shared/schemas/sentence";
import { UserIdSchema } from "@ichibun/shared/schemas/user";
import * as v from "valibot";

export class SentenceRepository {
	private storage: DurableObjectStorage;

	constructor(storage: DurableObjectStorage) {
		this.storage = storage;
	}

	public async putSentence(userId: string, sentence: string): Promise<void> {
		v.assert(SentenceSchema, sentence);
		v.assert(UserIdSchema, userId);

		await this.storage.put(`sentences:${userId}`, sentence);
	}

	public async getSentence(userId: string): Promise<string | null> {
		const sentence = await this.storage.get(`sentences:${userId}`);
		if (sentence) {
			v.assert(SentenceSchema, sentence);
			return sentence;
		}

		return null;
	}
}
