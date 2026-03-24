import { RoundId } from "../entities/round";
import { Sentence } from "../entities/sentence";
import { User } from "../entities/user";
import { Vote } from "../entities/vote";
import { SubmittedWord, Word } from "../entities/word";
import { Topic } from "./topic";

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
	| { type: "RoundEnded"; roundId: RoundId };

export type DecideResult =
	| { type: "Success"; events: GameEvent[] }
	| { type: "Failure"; reason: string };

export const success = (events: GameEvent[]): DecideResult => ({ type: "Success", events });
export const failure = (reason: string): DecideResult => ({ type: "Failure", reason });
