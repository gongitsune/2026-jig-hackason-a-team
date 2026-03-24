import { UseCaseResult, success, failure, UseCase } from ".";
import { decide } from "../domain/logics/room-decide";
import { evolve } from "../domain/logics/room-evolve";
import { Room, RoomCode } from "../domain/models/entities/room";
import { RoundId } from "../domain/models/entities/round";
import { User } from "../domain/models/entities/user";
import { GameCommand } from "../domain/models/values/room-commands";
import { Topic } from "../domain/models/values/topic";
import { RoomRepository, loadTopics } from "../domain/repositories/room-repository";

// ===== Common =====

type Deps = {
	roomRepo: RoomRepository;
};

const runCommand = (deps: Deps, room: Room, cmd: GameCommand): UseCaseResult<Room, string> => {
	const result = decide(room, cmd);
	if (result.type === "Failure") return failure(result.reason);

	let current = room;
	for (const event of result.events) {
		current = evolve(current, event);
		deps.roomRepo.save(current);
	}

	return success(current);
};

// ===== Use Cases =====

type JoinUserInput = {
	roomCode: RoomCode;
	user: User;
};

export const JoinUseCase: UseCase<Deps, JoinUserInput, Room> = (deps) => (input) => {
	const room = deps.roomRepo.load(input.roomCode);
	if (room.phase.tag !== "Waiting") {
		return failure("Game already started");
	}

	if (room.users.some((u) => u.id === input.user.id)) {
		return failure("User already in the room");
	}

	return runCommand(deps, room, { type: "Join", user: input.user });
};

export const LeaveUseCase: UseCase<Deps, JoinUserInput, Room> = (deps) => (input) => {
	const room = deps.roomRepo.load(input.roomCode);
	if (room.phase.tag !== "Waiting") {
		return failure("Game already started");
	}

	if (!room.users.some((u) => u.id === input.user.id)) {
		return failure("User not in the room");
	}

	return runCommand(deps, room, { type: "Leave", user: input.user });
};

export const StartGameUseCase: UseCase<Deps, RoomCode, Room> = (deps) => (roomCode) => {
	const room = deps.roomRepo.load(roomCode);
	if (room.phase.tag !== "Waiting") {
		return failure("Game already started");
	}

	if (room.users.length < 2) {
		return failure("Not enough players to start the game");
	}

	const topics = loadTopics();
	const topic = Topic(topics[Math.floor(Math.random() * topics.length)]);
	const roundId = RoundId("1");
	return runCommand(deps, room, { type: "StartGame", topic, roundId });
};
