import { DrizzleSqliteDODatabase } from "drizzle-orm/durable-sqlite";

import { votesTable } from "../db/schema";
import { Vote } from "../domain/vote";

export class VoteRepository {
	constructor(private readonly db: DrizzleSqliteDODatabase) {}

	public insertVote(vote: Vote): void {
		this.db.insert(votesTable).values({
			voterId: vote.userId,
			sentenceId: vote.sentenceId,
			roundId: vote.roundId,
		});
	}
}
