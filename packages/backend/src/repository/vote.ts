import { votesTable } from "@backend/db/schema";
import { Vote } from "@backend/domain/vote";
import { DrizzleSqliteDODatabase } from "drizzle-orm/durable-sqlite";

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
