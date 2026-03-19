import { RoomStatus } from "@ichibun/shared/api";
import { RoomStatusNotValidError } from "@ichibun/shared/error";

import { DistributedWords } from "./distributedWords";
import { Topic } from "./topic";
import { UserWord } from "./word";

export class Round {
	constructor(
		public readonly id: number,
		private status: RoomStatus,
		public readonly topic: Topic,
		private words: DistributedWords | null,
	) {}

	public static create(id: number): Round {
		const topic = Topic.create();

		return new Round(id, RoomStatus.Waiting, topic, null);
	}

	public getStatus(): RoomStatus {
		return this.status;
	}

	public getWords(): DistributedWords | null {
		return this.words;
	}

	public gotoWordInputting(): void {
		if (this.status !== RoomStatus.Waiting) {
			throw new RoomStatusNotValidError(this.status, RoomStatus.Waiting);
		}

		this.status = RoomStatus.WordInputing;
	}

	public gotoSentenceInputting(userWords: UserWord[]): void {
		if (this.status !== RoomStatus.WordInputing) {
			throw new RoomStatusNotValidError(this.status, RoomStatus.WordInputing);
		}

		this.words = DistributedWords.create(userWords);
		this.status = RoomStatus.SentenceInputing;
	}

	public gotoVoting(): void {
		if (this.status !== RoomStatus.SentenceInputing) {
			throw new RoomStatusNotValidError(this.status, RoomStatus.SentenceInputing);
		}

		this.status = RoomStatus.Voting;
	}
}
