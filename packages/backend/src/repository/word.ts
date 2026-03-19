import { usersTable, wordsTable } from "@backend/db/schema";
import { Round } from "@backend/domain/round";
import { UserWord } from "@backend/domain/word";
import { and, count, eq, isNull } from "drizzle-orm";
import { DrizzleSqliteDODatabase } from "drizzle-orm/durable-sqlite";

export class WordRepository {
	constructor(private readonly db: DrizzleSqliteDODatabase) {}

	public addUserWord(userWord: UserWord): void {
		this.db
			.insert(wordsTable)
			.values({
				word: userWord.word,
				writerId: userWord.userId,
				roundId: userWord.roundId,
			})
			.run();
	}

	public getUserWords(round: Round): UserWord[] {
		const res = this.db.select().from(wordsTable).where(eq(wordsTable.roundId, round.id)).all();
		return res.map((row) => new UserWord(row.word, row.writerId, row.roundId));
	}

	public getUserWordByUserId(round: Round, userId: string): UserWord | null {
		const res = this.db
			.select()
			.from(wordsTable)
			.where(and(eq(wordsTable.roundId, round.id), eq(wordsTable.writerId, userId)))
			.get();

		if (res) {
			return new UserWord(res.word, res.writerId, res.roundId);
		}
		return null;
	}

	public countNotSubmittedUser(round: Round): number {
		const res = this.db
			.select({
				notSubmitted: count(usersTable.id),
			})
			.from(usersTable)
			.leftJoin(
				wordsTable,
				and(eq(usersTable.id, wordsTable.writerId), eq(wordsTable.roundId, round.id)),
			)
			.where(isNull(wordsTable.id))
			.get();

		return res?.notSubmitted ?? 0;
	}
}
