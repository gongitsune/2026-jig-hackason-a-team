import { UseCaseResult, success, failure, UseCase } from ".";
import { GameCommand } from "../domain/room/commands";
import { decide } from "../domain/room/decide";
import { evolve } from "../domain/room/evolve";
import { RoomRepository } from "../domain/room/repository";
import { Room, RoomCode } from "../domain/room/value-objects/room";
import { User } from "../domain/user/user";

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

	return runCommand(deps, room, { type: "StartGame", roundId: 1 });
};
