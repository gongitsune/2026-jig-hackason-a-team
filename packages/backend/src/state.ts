import { DrizzleSqliteDODatabase } from "drizzle-orm/durable-sqlite";

import { GameResultRepository } from "./repository/gameResult";
import { RoundRepository } from "./repository/round";
import { SentenceRepository } from "./repository/sentence";
import { UserRepository } from "./repository/user";
import { VoteRepository } from "./repository/vote";
import { WordRepository } from "./repository/word";

export class AppState {
	// Repositories
	public readonly userRepository: UserRepository;
	public readonly wordRepository: WordRepository;
	public readonly sentenceRepository: SentenceRepository;
	public readonly voteRepository: VoteRepository;
	public readonly roundRepository: RoundRepository;
	public readonly gameResultRepository: GameResultRepository;

	public constructor(private readonly db: DrizzleSqliteDODatabase) {
		this.userRepository = new UserRepository(this.db);
		this.wordRepository = new WordRepository(this.db);
		this.sentenceRepository = new SentenceRepository(this.db);
		this.voteRepository = new VoteRepository(this.db);
		this.roundRepository = new RoundRepository(this.db);
		this.gameResultRepository = new GameResultRepository(this.db);
	}
}
