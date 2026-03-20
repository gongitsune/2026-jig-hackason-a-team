import { GameResult } from "@ichibun/shared/api";
import { count, eq } from "drizzle-orm";
import { DrizzleSqliteDODatabase } from "drizzle-orm/durable-sqlite";

import { roundsTable, sentencesTable, usersTable, votesTable } from "../db/schema";

export class GameResultRepository {
	constructor(private readonly db: DrizzleSqliteDODatabase) {}

	public getLastResult(roundId: number): GameResult | null {
		const round = this.db.select().from(roundsTable).where(eq(roundsTable.id, roundId)).get();
		if (!round) {
			return null;
		}

		const lastResults = this.db
			.select({
				userName: usersTable.name,
				sentence: sentencesTable.sentence,
				voteCount: count(votesTable.id),
			})
			.from(sentencesTable)
			.innerJoin(votesTable, eq(sentencesTable.id, votesTable.sentenceId))
			.innerJoin(usersTable, eq(sentencesTable.writerId, usersTable.id))
			.where(eq(votesTable.roundId, roundId))
			.groupBy(sentencesTable.id)
			.all();

		return {
			topic: round.topic,
			results: lastResults,
		};
	}
}
