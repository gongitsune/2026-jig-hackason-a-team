import { GameResult, RoomAPI, RoomStatus, SentenceToVote, UserInfo } from "@ichibun/shared/api";

export class RoomApiImpl implements RoomAPI {
	getRoomStatus(): Promise<RoomStatus> {
		throw new Error("Method not implemented.");
	}
	getTopic(): Promise<string> {
		throw new Error("Method not implemented.");
	}
	getLastResult(): Promise<GameResult | null> {
		throw new Error("Method not implemented.");
	}
	getUsers(): Promise<UserInfo[]> {
		throw new Error("Method not implemented.");
	}
	getDistributedWords(): Promise<string[]> {
		throw new Error("Method not implemented.");
	}
	getSentencesToVote(): Promise<SentenceToVote[]> {
		throw new Error("Method not implemented.");
	}
	startGame(): Promise<void> {
		throw new Error("Method not implemented.");
	}
	submitWord(word: string): Promise<void> {
		throw new Error("Method not implemented.");
	}
	submitSentence(sentence: string): Promise<void> {
		throw new Error("Method not implemented.");
	}
	submitVote(sentenceUserId: string): Promise<void> {
		throw new Error("Method not implemented.");
	}
}
