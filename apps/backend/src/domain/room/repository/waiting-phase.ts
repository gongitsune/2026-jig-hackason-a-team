import { and, count, eq } from "drizzle-orm";
import { DrizzleSqliteDODatabase } from "drizzle-orm/durable-sqlite";

import { roundsTable, sentencesTable, usersTable, votesTable } from "../../../db/schema";
import { User, UserId, UserName } from "../../user/user";
import { WaitingPhase } from "../value-objects/game-phase";
import { GameResult, UserResult } from "../value-objects/game-result";
import { RoundId } from "../value-objects/round";
import { Sentence } from "../value-objects/sentence";
import { Topic } from "../value-objects/topic";

export const loadWaitingPhase = (
	db: DrizzleSqliteDODatabase,
	latestRound: typeof roundsTable.$inferSelect | undefined,
) => {
	if (!latestRound) {
		return WaitingPhase();
	}

	// リザルトを取得して構築
	const lastUserResults = db
		.select({
			user: {
				id: sentencesTable.writerId,
				name: usersTable.name,
			},
			sentence: sentencesTable.sentence,
			voteCount: count(votesTable.voterId),
		})
		.from(sentencesTable)
		.where(eq(sentencesTable.roundId, latestRound.id))
		.innerJoin(
			votesTable,
			and(eq(votesTable.roundId, latestRound.id), eq(votesTable.targetId, sentencesTable.writerId)),
		)
		.innerJoin(usersTable, eq(usersTable.id, sentencesTable.writerId))
		.groupBy(sentencesTable.writerId)
		.all();

	return WaitingPhase(
		GameResult(
			latestRound.roundNumber,
			Topic(latestRound.topic),
			lastUserResults.map((r) =>
				UserResult(
					User(UserId(r.user.id), UserName(r.user.name)),
					Sentence(UserId(r.user.id), RoundId(latestRound.id), r.sentence),
					r.voteCount,
				),
			),
		),
	);
};
