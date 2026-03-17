import * as v from "valibot";

export class DistributedWordsRepository {
	private storage: DurableObjectStorage;

	constructor(storage: DurableObjectStorage) {
		this.storage = storage;
	}

	public async updateWords(words: string[]): Promise<void> {
		await this.storage.put("distributedWords", words);
	}

	public async getWords(): Promise<string[]> {
		const words = await this.storage.get("distributedWords");
		v.assert(v.array(v.string()), words);

		return words;
	}
}
