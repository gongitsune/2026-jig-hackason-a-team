import { roundsTable } from "@backend/db/schema";
import { DistributedWords } from "@backend/domain/distributedWords";
import { Round } from "@backend/domain/round";
import { Topic } from "@backend/domain/topic";
import { SystemWord } from "@backend/domain/word";
import { eq, max } from "drizzle-orm";
import { DrizzleSqliteDODatabase } from "drizzle-orm/durable-sqlite";

export class RoundRepository {
	constructor(private readonly db: DrizzleSqliteDODatabase) {}

	private static toPersistance(round: Round) {
		const words = round.getWords();
		return {
			id: round.id,
			status: round.getStatus(),
			topic: round.topic.text,
			distributedWords: words ? JSON.stringify(words.words.map((w) => w.word)) : null,
		};
	}

	public insertRound(round: Round) {
		const res = this.db.insert(roundsTable).values(RoundRepository.toPersistance(round)).run();
		return res.rowsWritten > 0;
	}

	public updateRound(round: Round): boolean {
		const { id: _, ...set } = RoundRepository.toPersistance(round);
		const res = this.db.update(roundsTable).set(set).where(eq(roundsTable.id, round.id)).run();
		return res.rowsWritten > 0;
	}

	public getCurrentRound(): Round | null {
		const round = this.db
			.select()
			.from(roundsTable)
			.where(eq(roundsTable.id, max(roundsTable.id)))
			.get();

		if (round) {
			let distributedWords = null;
			if (round.distributedWords) {
				const words = JSON.parse(round.distributedWords) as string[];
				distributedWords = new DistributedWords(words.map((w) => new SystemWord(w)));
			}

			return new Round(round.id, round.status, new Topic(round.topic), distributedWords);
		}
		return null;
	}
}
