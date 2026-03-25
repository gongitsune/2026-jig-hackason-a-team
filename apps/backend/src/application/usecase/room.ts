import assert from "assert";

import { UseCaseResult, success, failure, UseCase } from ".";
import { decide } from "../../domain/logics/room-decide";
import { evolve } from "../../domain/logics/room-evolve";
import { Room, RoomCode } from "../../domain/models/entities/room";
import { Round, RoundId, RoundStatus } from "../../domain/models/entities/round";
import { Sentence } from "../../domain/models/entities/sentence";
import { User, UserId } from "../../domain/models/entities/user";
import { Vote } from "../../domain/models/entities/vote";
import { SubmittedWord, Word } from "../../domain/models/entities/word";
import { GameResult } from "../../domain/models/values/game-result";
import { GameCommand, GameEvent } from "../../domain/models/values/room-commands";
import { Topic } from "../../domain/models/values/topic";
import { loadSystemWords, RoomRepository } from "../../domain/repositories/room-repository";
import { UserRepository } from "../../domain/repositories/user-repository";
import { IdGenerator } from "../service/id-generator";
import { TopicService } from "../service/topic-service";

// ===== Common =====

type Deps = {
	roomRepo: RoomRepository;
};

type CommandResult = {
	events: GameEvent[];
	room: Room;
};

const runCommand = (
	deps: Deps,
	room: Room,
	cmd: GameCommand,
): UseCaseResult<CommandResult, string> => {
	const result = decide(room, cmd);
	if (result.type === "Failure") return failure(result.reason);

	let current = room;
	for (const event of result.events) {
		current = evolve(current, event);
		deps.roomRepo.save(current);
	}

	return success({
		events: result.events,
		room: current,
	});
};

// ===== Use Cases =====

type JoinUserInput = {
	roomCode: RoomCode;
	user: User;
};

type JoinUserOutput = {
	users: User[];
	result?: GameResult;
};

type JoinUserDeps = Deps & {
	userRepo: UserRepository;
};

export const JoinUseCase: UseCase<JoinUserDeps, JoinUserInput, JoinUserOutput> =
	(deps) => (input) => {
		const room = deps.roomRepo.load(input.roomCode);

		deps.userRepo.insertUser(input.user);
		const res = runCommand(deps, room, { type: "Join", user: input.user });

		if (res.ok) {
			const resRoom = res.data.room;
			assert(resRoom.phase.tag === "Waiting");
			return success({ users: resRoom.users, result: resRoom.phase.lastResult });
		}
		return failure(res.error);
	};

type LeaveUserInput = {
	roomCode: RoomCode;
	userId: UserId;
};

export const LeaveUseCase: UseCase<JoinUserDeps, LeaveUserInput, JoinUserOutput> =
	(deps) => (input) => {
		const room = deps.roomRepo.load(input.roomCode);

		deps.userRepo.deleteUser(input.userId);
		const res = runCommand(deps, room, { type: "Leave", userId: input.userId });

		if (res.ok) return success({ users: res.data.room.users });
		return failure(res.error);
	};

type StartGameOutput = {
	topic: Topic;
};

type StartGameDeps = Deps & {
	topicService: TopicService;
	idGenerator: IdGenerator;
};

export const StartGameUseCase: UseCase<StartGameDeps, RoomCode, StartGameOutput> =
	(deps) => (roomCode) => {
		const room = deps.roomRepo.load(roomCode);
		assert(room.phase.tag === "Waiting");

		const topic = deps.topicService.pickRandom();
		const roundId = RoundId(deps.idGenerator.generate());
		const roundNumber = (room.phase.lastResult?.roundNumber ?? 0) + 1;
		const round = Round(roundId, roundNumber, topic, RoundStatus("Waiting"));
		deps.roomRepo.insertRound(round);

		const res = runCommand(deps, room, { type: "StartGame", topic, roundId });

		if (res.ok) return success({ topic });
		return failure(res.error);
	};

type SubmitWordInput = {
	roomCode: RoomCode;
	userId: UserId;
	word: Word;
};

type SubmitWordOutput = { phaseChanged: false } | { phaseChanged: true; distributedWords: Word[] };

export const SubmitWordUseCase: UseCase<Deps, SubmitWordInput, SubmitWordOutput> =
	(deps) => (input) => {
		const room = deps.roomRepo.load(input.roomCode);
		assert(room.phase.tag === "WordInputting");

		const res = runCommand(deps, room, {
			type: "SubmitWord",
			systemWords: loadSystemWords(),
			word: SubmittedWord(input.userId, room.phase.roundId, input.word),
		});

		if (!res.ok) return failure(res.error);

		const event = res.data.events.find((e) => e.type === "AllWordsSubmitted");
		if (event) {
			return success({
				phaseChanged: true,
				distributedWords: event.distributedWords,
			});
		}
		return success({ phaseChanged: false });
	};

type SubmitSentenceInput = {
	roomCode: RoomCode;
	userId: UserId;
	sentence: string;
};

type SubmitSentenceOutput = { phaseChanged: false } | { phaseChanged: true; sentences: Sentence[] };

export const SubmitSentenceUseCase: UseCase<Deps, SubmitSentenceInput, SubmitSentenceOutput> =
	(deps) => (input) => {
		const room = deps.roomRepo.load(input.roomCode);
		assert(room.phase.tag === "SentenceInputting");

		const res = runCommand(deps, room, {
			type: "SubmitSentence",
			sentence: Sentence(input.userId, room.phase.roundId, input.sentence),
		});
		if (!res.ok) return failure(res.error);

		const event = res.data.events.find((e) => e.type === "AllSentencesSubmitted");
		if (event) {
			return success({
				phaseChanged: true,
				sentences: event.sentences,
			});
		}
		return success({ phaseChanged: false });
	};

type VoteInput = {
	roomCode: RoomCode;
	userId: UserId;
	targetUserId: UserId;
};

type VoteOutput = { phaseChanged: false } | { phaseChanged: true; result: GameResult };

export const VoteUseCase: UseCase<Deps, VoteInput, VoteOutput> = (deps) => (input) => {
	const room = deps.roomRepo.load(input.roomCode);
	assert(room.phase.tag === "Voting");

	const round = deps.roomRepo.findRoundById(room.phase.roundId);
	assert(round);

	const res = runCommand(deps, room, {
		type: "Vote",
		vote: Vote(input.userId, room.phase.roundId, input.targetUserId),
		roundNumber: round.roundNumber,
	});
	if (!res.ok) return failure(res.error);

	const event = res.data.events.find((e) => e.type === "RoundEnded");
	if (event) {
		const resRoom = res.data.room;
		assert(resRoom.phase.tag === "Waiting");

		return success({
			phaseChanged: true,
			result: resRoom.phase.lastResult!,
		});
	}
	return success({ phaseChanged: false });
};
