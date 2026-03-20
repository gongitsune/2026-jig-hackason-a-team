import { GameResult, RoomAPI, RoomStatus, SentenceToVote, UserInfo } from "@ichibun/shared/api";
import {
	IllegalOperationError,
	InternalServerError,
	RoomStatusNotValidError,
} from "@ichibun/shared/error";
import { RpcTarget } from "capnweb";

import { Round } from "../domain/round";
import { Sentence } from "../domain/sentence";
import { User } from "../domain/user";
import { UserWord } from "../domain/word";
import { AppState } from "../state";

export class RoomApiImpl extends RpcTarget implements RoomAPI {
	constructor(
		private readonly state: AppState,
		private readonly apiUser: User,
	) {
		super();
	}

	private getRoundAndAssertStatus(expectedStatus: RoomStatus): Round {
		const round = this.state.roundRepository.getCurrentRound();

		if (!round) {
			throw new InternalServerError("No round found");
		}

		const actualStatus = round.getStatus();

		if (actualStatus !== expectedStatus) {
			throw new RoomStatusNotValidError(expectedStatus, actualStatus);
		}

		return round;
	}

	getRoundStatus(): RoomStatus {
		const round = this.state.roundRepository.getCurrentRound();
		if (round) {
			return round.getStatus();
		}

		throw new Error("No round found");
	}

	getTopic(): string {
		const round = this.state.roundRepository.getCurrentRound();
		if (round) {
			return round.topic.text;
		}

		throw new Error("No round found");
	}

	getLastResult(): GameResult | null {
		const currentRound = this.getRoundAndAssertStatus(RoomStatus.Waiting);
		const results = this.state.gameResultRepository.getLastResult(currentRound.id - 1);

		return results ? results : null;
	}

	getUsers(): UserInfo[] {
		this.getRoundAndAssertStatus(RoomStatus.Waiting);

		const usersWithPoint = this.state.userRepository.findAllUsersWithPoint();

		return usersWithPoint.map(({ user, point }) => ({
			userId: user.id,
			name: user.getName(),
			point,
		}));
	}

	getDistributedWords(): string[] {
		const round = this.getRoundAndAssertStatus(RoomStatus.WordInputing);
		const words = round.getWords()?.words.map((word) => word.word);

		if (words) {
			return words;
		}

		throw new InternalServerError("No distributed words found");
	}

	getSentencesToVote(): SentenceToVote[] {
		const round = this.getRoundAndAssertStatus(RoomStatus.Voting);

		const sentences = this.state.sentenceRepository.getSentencesByRoundId(round.id);
		return sentences.map((sentence) => ({
			userName: sentence.user.getName(),
			sentence: sentence.sentence,
		}));
	}

	startGame(): void {
		const round = this.getRoundAndAssertStatus(RoomStatus.Waiting);

		round.gotoWordInputting();
		this.state.roundRepository.updateRound(round);
	}

	submitWord(word: string): void {
		const round = this.getRoundAndAssertStatus(RoomStatus.WordInputing);
		const wordRepository = this.state.wordRepository;

		if (wordRepository.getUserWordByUserId(round, this.apiUser.id)) {
			throw new IllegalOperationError("User has already submitted a word");
		}
		const newUserWord = UserWord.create(word, this.apiUser.id, round.id);
		wordRepository.addUserWord(newUserWord);

		// 全員が単語を提出したか確認
		const notSubmittedUserCount = wordRepository.countNotSubmittedUser(round);
		if (notSubmittedUserCount === 0) {
			const userWords = wordRepository.getUserWords(round);
			round.gotoSentenceInputting(userWords);
			this.state.roundRepository.updateRound(round);
		}
	}

	submitSentence(sentence: string): void {
		const round = this.getRoundAndAssertStatus(RoomStatus.SentenceInputing);
		const sentenceRepository = this.state.sentenceRepository;

		if (sentenceRepository.getSentenceByUserId(round.id, this.apiUser.id)) {
			throw new IllegalOperationError("User has already submitted a sentence");
		}
		const newSentence = Sentence.create(this.apiUser, sentence, round.id);
		sentenceRepository.addSentence(newSentence);

		// 全員が文章を提出したか確認
		const notSubmittedUserCount = sentenceRepository.countNotSubmittedUser(round.id);
		if (notSubmittedUserCount === 0) {
			round.gotoVoting();
			this.state.roundRepository.updateRound(round);
		}
	}
	submitVote(_sentenceUserId: string): Promise<void> {
		throw new Error("Method not implemented.");
	}
}
