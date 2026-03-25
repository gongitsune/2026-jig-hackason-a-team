import assert from "assert";

import { sampleN, shuffleArray } from "../../utils/random";
import { Room } from "../models/entities/room";
import { RoundId } from "../models/entities/round";
import { Sentence } from "../models/entities/sentence";
import { User, UserId } from "../models/entities/user";
import { Vote } from "../models/entities/vote";
import { SubmittedWord, Word } from "../models/entities/word";
import { GameResult, UserResult } from "../models/values/game-result";
import {
	DecideResult,
	failure,
	GameCommand,
	GameEvent,
	success,
} from "../models/values/room-commands";
import { Topic } from "../models/values/topic";

const join = (room: Room, user: User): DecideResult => {
	if (room.phase.tag !== "Waiting") {
		return failure("Game already started");
	}
	if (room.users.some((u) => u.id === user.id)) {
		return failure("User already in the room");
	}

	const joinedEvent = { type: "UserJoined", user } satisfies GameEvent;
	return success([joinedEvent]);
};
const leave = (room: Room, userId: UserId): DecideResult => {
	if (room.phase.tag !== "Waiting") {
		return failure("Game already started");
	}
	if (!room.users.some((u) => u.id === userId)) {
		return failure("User not in the room");
	}

	const leftEvent = { type: "UserLeft", userId: userId } satisfies GameEvent;
	return success([leftEvent]);
};
const startGame = (room: Room, topic: Topic, roundId: RoundId): DecideResult => {
	if (room.phase.tag !== "Waiting") {
		return failure("Game already started");
	}
	if (room.users.length < 2) {
		return failure("Not enough players to start the game");
	}

	const gameStartedEvent = {
		type: "GameStarted",
		topic,
		roundId,
	} satisfies GameEvent;
	return success([gameStartedEvent]);
};
const submitWord = (room: Room, word: SubmittedWord, systemWords: Word[]): DecideResult => {
	if (room.phase.tag !== "WordInputting") {
		return failure("Not in word inputting phase");
	}

	if (room.phase.submitted.some((w) => w.writerId === word.writerId)) {
		return failure("User already submitted a word");
	}

	const wordSubmittedEvent = {
		type: "WordSubmitted",
		word,
	} satisfies GameEvent;

	// 全員が単語を提出したかどうかをチェック
	if (room.phase.submitted.length + 1 === room.users.length) {
		const DISTRIBUTED_WORD_COUNT = 10;
		const userWords = shuffleArray([...room.phase.submitted, word].map((w) => w.word));
		let distributedWords: Word[] = [];
		if (userWords.length > DISTRIBUTED_WORD_COUNT) {
			distributedWords = userWords.slice(0, DISTRIBUTED_WORD_COUNT);
		} else {
			distributedWords = [
				...userWords,
				...sampleN(systemWords, DISTRIBUTED_WORD_COUNT - userWords.length),
			];
		}

		const allWordsSubmittedEvent = {
			type: "AllWordsSubmitted",
			roundId: room.phase.roundId,
			distributedWords,
		} satisfies GameEvent;
		return success([wordSubmittedEvent, allWordsSubmittedEvent]);
	}

	return success([wordSubmittedEvent]);
};
const submitSentence = (room: Room, sentence: Sentence): DecideResult => {
	if (room.phase.tag !== "SentenceInputting") {
		return failure("Not in sentence inputting phase");
	}

	if (room.phase.submitted.some((s) => s.writerId === sentence.writerId)) {
		return failure("User already submitted a sentence");
	}

	const sentenceSubmittedEvent = {
		type: "SentenceSubmitted",
		sentence,
	} satisfies GameEvent;

	// 全員が文章を提出したかどうかをチェック
	if (room.phase.submitted.length + 1 === room.users.length) {
		const allSentencesSubmittedEvent = {
			type: "AllSentencesSubmitted",
			roundId: room.phase.roundId,
			sentences: [...room.phase.submitted, sentence],
		} satisfies GameEvent;
		return success([sentenceSubmittedEvent, allSentencesSubmittedEvent]);
	}

	return success([sentenceSubmittedEvent]);
};
const voting = (room: Room, vote: Vote, roundNumber: number): DecideResult => {
	if (room.phase.tag !== "Voting") {
		return failure("Not in voting phase");
	}

	if (room.phase.submitted.some((v) => v.voterId === vote.voterId)) {
		return failure("User already submitted a vote");
	}

	const voteSubmittedEvent = {
		type: "VoteSubmitted",
		vote,
	} satisfies GameEvent;

	// 全員が投票したかどうかをチェック
	if (room.phase.submitted.length + 1 === room.users.length) {
		const submitted = [...room.phase.submitted, vote];
		const sentences = room.phase.sentences;
		const roundEndedEvent = {
			type: "RoundEnded",
			roundId: room.phase.roundId,
			result: GameResult(
				roundNumber,
				room.phase.topic,
				room.users.map((u) => {
					const voteCount = submitted.filter((v) => v.targetId === u.id).length;
					const sentence = sentences.find((s) => s.writerId === u.id);
					assert(sentence, "Sentence not found for user " + u.id);

					return UserResult(u, sentence, voteCount);
				}),
			),
		} satisfies GameEvent;
		return success([voteSubmittedEvent, roundEndedEvent]);
	}

	return success([voteSubmittedEvent]);
};

export const decide = (room: Room, cmd: GameCommand): DecideResult => {
	switch (cmd.type) {
		case "Join":
			return join(room, cmd.user);
		case "Leave":
			return leave(room, cmd.userId);
		case "StartGame":
			return startGame(room, cmd.topic, cmd.roundId);
		case "SubmitWord":
			return submitWord(room, cmd.word, cmd.systemWords);
		case "SubmitSentence":
			return submitSentence(room, cmd.sentence);
		case "Vote":
			return voting(room, cmd.vote, cmd.roundNumber);
	}
};
