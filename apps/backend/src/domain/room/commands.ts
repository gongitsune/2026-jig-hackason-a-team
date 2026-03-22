import { User } from "../user/user";
import { RoundId } from "./value-objects/round";
import { Sentence } from "./value-objects/sentence";
import { Topic } from "./value-objects/topic";
import { Vote } from "./value-objects/vote";
import { SubmittedWord, Word } from "./value-objects/word";

export type GameCommand =
	| { type: "Join"; user: User }
	| { type: "Leave"; user: User }
	| { type: "StartGame"; topic: Topic; roundId: RoundId }
	| { type: "SubmitWord"; word: SubmittedWord; systemWords: Word[] }
	| { type: "SubmitSentence"; sentence: Sentence }
	| { type: "Vote"; vote: Vote };

export type GameEvent =
	| { type: "UserJoined"; user: User }
	| { type: "UserLeft"; user: User }
	| { type: "GameStarted"; topic: Topic; roundId: RoundId }
	| { type: "WordSubmitted"; word: SubmittedWord }
	| { type: "AllWordsSubmitted"; roundId: RoundId; distributedWords: Word[] }
	| { type: "SentenceSubmitted"; sentence: Sentence }
	| { type: "AllSentencesSubmitted"; roundId: RoundId }
	| { type: "VoteSubmitted"; vote: Vote }
	| { type: "RoundEnded" };

export type DecideResult =
	| { type: "Success"; events: GameEvent[] }
	| { type: "Failure"; reason: string };

export const success = (events: GameEvent[]): DecideResult => ({ type: "Success", events });
export const failure = (reason: string): DecideResult => ({ type: "Failure", reason });
