import { SentenceSchema } from "@ichibun/shared/schemas/sentence";
import { UserIdSchema } from "@ichibun/shared/schemas/user";
import assert from "assert";
import * as v from "valibot";

export class SentenceRepository {
	private storage: DurableObjectStorage;

	constructor(storage: DurableObjectStorage) {
		this.storage = storage;
	}

	public async putSentence(userId: string, sentence: string): Promise<void> {
		assert(v.is(SentenceSchema, sentence), "Invalid sentence data");
		assert(v.is(UserIdSchema, userId), "Invalid user ID");

		await this.storage.put(`sentences:${userId}`, sentence);
	}

	public async getSentence(userId: string): Promise<string | null> {
		const sentence = await this.storage.get(`sentences:${userId}`);
		if (sentence) {
			assert(v.is(SentenceSchema, sentence), "Invalid sentence data in storage");
			return sentence;
		}

		return null;
	}
}
