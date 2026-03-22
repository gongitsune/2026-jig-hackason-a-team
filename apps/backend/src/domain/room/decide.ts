import { sampleN, shuffleArray } from "../../utils/random";
import { User } from "../user/user";
import { DecideResult, failure, GameCommand, GameEvent, success } from "./commands";
import { Room } from "./value-objects/room";
import { RoundId } from "./value-objects/round";
import { Sentence } from "./value-objects/sentence";
import { Topic } from "./value-objects/topic";
import { Vote } from "./value-objects/vote";
import { SubmittedWord, Word } from "./value-objects/word";

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
const leave = (room: Room, user: User): DecideResult => {
	if (room.phase.tag !== "Waiting") {
		return failure("Game already started");
	}
	if (!room.users.some((u) => u.id === user.id)) {
		return failure("User not in the room");
	}

	const leftEvent = { type: "UserLeft", user: user } satisfies GameEvent;
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
		} satisfies GameEvent;
		return success([sentenceSubmittedEvent, allSentencesSubmittedEvent]);
	}

	return success([sentenceSubmittedEvent]);
};
const voting = (room: Room, vote: Vote): DecideResult => {
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
		const allVotesSubmittedEvent = {
			type: "RoundEnded",
		} satisfies GameEvent;
		return success([voteSubmittedEvent, allVotesSubmittedEvent]);
	}

	return success([voteSubmittedEvent]);
};

export const decide = (room: Room, cmd: GameCommand): DecideResult => {
	switch (cmd.type) {
		case "Join":
			return join(room, cmd.user);
		case "Leave":
			return leave(room, cmd.user);
		case "StartGame":
			return startGame(room, cmd.topic, cmd.roundId);
		case "SubmitWord":
			return submitWord(room, cmd.word, cmd.systemWords);
		case "SubmitSentence":
			return submitSentence(room, cmd.sentence);
		case "Vote":
			return voting(room, cmd.vote);
	}
};
