import assert from "assert";

import { GameEvent } from "./commands";
import {
	addSentenceToSentenceInputPhase,
	addVoteToVotePhase,
	addWordToWordInputPhase,
	ResultPhase,
	SentenceInputPhase,
	VotePhase,
	WordInputPhase,
} from "./value-objects/game-phase";
import { addUserToRoom, removeUserFromRoom, Room, updateRoomPhase } from "./value-objects/room";

type EventHandler<Type extends GameEvent["type"]> = (
	room: Room,
	event: Extract<GameEvent, { type: Type }>,
) => Room;

const userJoined: EventHandler<"UserJoined"> = (room, event) => {
	return addUserToRoom(room, event.user);
};
const userLeft: EventHandler<"UserLeft"> = (room, event) => {
	return removeUserFromRoom(room, event.user);
};
const gameStarted: EventHandler<"GameStarted"> = (room, event) => {
	return updateRoomPhase(room, WordInputPhase(event.roundId, event.topic));
};
const wordSubmitted: EventHandler<"WordSubmitted"> = (room, event) => {
	assert(room.phase.tag === "WordInputting");
	return updateRoomPhase(room, addWordToWordInputPhase(room.phase, event.word));
};
const allWordsSubmitted: EventHandler<"AllWordsSubmitted"> = (room, event) => {
	assert(room.phase.tag === "WordInputting");
	return updateRoomPhase(
		room,
		SentenceInputPhase(event.roundId, room.phase.topic, event.distributedWords),
	);
};
const sentenceSubmitted: EventHandler<"SentenceSubmitted"> = (room, event) => {
	assert(room.phase.tag === "SentenceInputting");
	return updateRoomPhase(room, addSentenceToSentenceInputPhase(room.phase, event.sentence));
};
const allSentencesSubmitted: EventHandler<"AllSentencesSubmitted"> = (room, event) => {
	assert(room.phase.tag === "SentenceInputting");
	return updateRoomPhase(room, VotePhase(event.roundId, room.phase.topic));
};
const voteSubmitted: EventHandler<"VoteSubmitted"> = (room, event) => {
	assert(room.phase.tag === "Voting");
	return updateRoomPhase(room, addVoteToVotePhase(room.phase, event.vote));
};
const roundEnded: EventHandler<"RoundEnded"> = (room, _event) => {
	assert(room.phase.tag === "Voting");
	return updateRoomPhase(room, ResultPhase());
};

export const evolve = (room: Room, event: GameEvent): Room => {
	switch (event.type) {
		case "UserJoined":
			return userJoined(room, event);
		case "UserLeft":
			return userLeft(room, event);
		case "GameStarted":
			return gameStarted(room, event);
		case "WordSubmitted":
			return wordSubmitted(room, event);
		case "AllWordsSubmitted":
			return allWordsSubmitted(room, event);
		case "SentenceSubmitted":
			return sentenceSubmitted(room, event);
		case "AllSentencesSubmitted":
			return allSentencesSubmitted(room, event);
		case "VoteSubmitted":
			return voteSubmitted(room, event);
		case "RoundEnded":
			return roundEnded(room, event);
	}
};
