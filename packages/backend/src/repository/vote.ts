import { UserIdSchema } from "@ichibun/shared/schemas/user";
import assert from "assert";
import * as v from "valibot";

export class VoteRepository {
	private storage: DurableObjectStorage;

	constructor(storage: DurableObjectStorage) {
		this.storage = storage;
	}

	public async putVote(userId: string, vote: number): Promise<void> {
		assert(v.is(v.number(), vote), "Invalid vote data");
		assert(v.is(UserIdSchema, userId), "Invalid user ID");

		await this.storage.put(`votes:${userId}`, vote);
	}

	public async getVote(userId: string): Promise<number | null> {
		const vote = await this.storage.get(`votes:${userId}`);
		if (vote) {
			assert(v.is(v.number(), vote), "Invalid vote data in storage");
			return vote;
		}

		return null;
	}
}
