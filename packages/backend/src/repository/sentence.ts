import { sentencesTable, usersTable } from "@backend/db/schema";
import { Sentence } from "@backend/domain/sentence";
import { User } from "@backend/domain/user";
import { and, count, eq, isNull } from "drizzle-orm";
import { DrizzleSqliteDODatabase } from "drizzle-orm/durable-sqlite";

export class SentenceRepository {
	constructor(private readonly db: DrizzleSqliteDODatabase) {}

	public addSentence(sentence: Sentence): void {
		this.db
			.insert(sentencesTable)
			.values({
				writerId: sentence.user.id,
				sentence: sentence.sentence,
				roundId: sentence.roundId,
			})
			.run();
	}

	public getSentencesByRoundId(roundId: number): Sentence[] {
		const res = this.db
			.select({
				writerId: sentencesTable.writerId,
				sentence: sentencesTable.sentence,
				roundId: sentencesTable.roundId,
				userName: usersTable.name,
			})
			.from(sentencesTable)
			.where(eq(sentencesTable.roundId, roundId))
			.innerJoin(usersTable, eq(sentencesTable.writerId, usersTable.id))
			.all();

		return res.map(
			(row) => new Sentence(new User(row.writerId, row.userName), row.sentence, row.roundId),
		);
	}

	public getSentenceByUserId(roundId: number, userId: string): Sentence | null {
		const res = this.db
			.select({
				writerId: sentencesTable.writerId,
				sentence: sentencesTable.sentence,
				roundId: sentencesTable.roundId,
				userName: usersTable.name,
			})
			.from(sentencesTable)
			.where(and(eq(sentencesTable.roundId, roundId), eq(sentencesTable.writerId, userId)))
			.innerJoin(usersTable, eq(sentencesTable.writerId, usersTable.id))
			.get();

		if (res) {
			return new Sentence(new User(res.writerId, res.userName), res.sentence, res.roundId);
		}
		return null;
	}

	public countNotSubmittedUser(roundId: number): number {
		const res = this.db
			.select({
				notSubmitted: count(usersTable.id),
			})
			.from(usersTable)
			.leftJoin(
				sentencesTable,
				and(eq(usersTable.id, sentencesTable.writerId), eq(sentencesTable.roundId, roundId)),
			)
			.where(isNull(sentencesTable.id))
			.get();

		return res?.notSubmitted ?? 0;
	}
}
