import { UserIdSchema } from "@ichibun/shared/schemas/user";
import { WordSchema } from "@ichibun/shared/schemas/word";
import assert from "assert";
import * as v from "valibot";

const UserWordsSchema = v.array(
	v.object({
		userId: UserIdSchema,
		word: WordSchema,
	}),
);

export type UserWords = v.InferInput<typeof UserWordsSchema>;

export class WordRepository {
	private systemWords: string[] = [];
	private storage: DurableObjectStorage;

	constructor(storage: DurableObjectStorage) {
		this.storage = storage;
	}

	public async updateUserWords(userWords: UserWords): Promise<void> {
		assert(v.is(UserWordsSchema, userWords), "Invalid user words data");
		this.storage.put("words", userWords);
	}

	public async getUserWords(): Promise<string[]> {
		const words = await this.storage.get("words");
		if (words) {
			assert(v.is(UserWordsSchema, words), "Invalid words data in storage");
			return words.map((w) => w.word);
		}
		return [];
	}

	public getSystemWords(): ReadonlyArray<string> {
		return this.systemWords;
	}
}
