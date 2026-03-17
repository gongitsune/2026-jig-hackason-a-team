import { UserIdSchema } from "@ichibun/shared/schemas/user";
import * as v from "valibot";

export class VoteRepository {
	private storage: DurableObjectStorage;

	constructor(storage: DurableObjectStorage) {
		this.storage = storage;
	}

	public async putVote(userId: string, vote: number): Promise<void> {
		v.assert(v.number(), vote);
		v.assert(UserIdSchema, userId);

		await this.storage.put(`votes:${userId}`, vote);
	}

	public async getVote(userId: string): Promise<number | null> {
		const vote = await this.storage.get(`votes:${userId}`);
		if (vote) {
			v.assert(v.number(), vote);
			return vote;
		}

		return null;
	}
}
