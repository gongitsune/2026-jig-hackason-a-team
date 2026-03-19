import assert from "assert";

import { RoomStatus } from "@ichibun/shared/api";
import { RoomStatusNotValidError, UserDupulicateError } from "@ichibun/shared/error";
import { PassphraseSchema } from "@ichibun/shared/schemas/room";
import * as v from "valibot";

import { Round } from "./round";
import { User } from "./user";

export class Room {
	constructor(
		public readonly passphrase: string,
		private users: User[],
		private rounds: Round[],
	) {}

	public static create(passphrase: string): Room {
		v.assert(PassphraseSchema, passphrase);

		return new Room(passphrase, [], []);
	}

	public getCurrentRound(): Round | null {
		if (this.rounds.length === 0) {
			return null;
		}
		return this.rounds[this.rounds.length - 1];
	}

	public startRound(newRound: Round): void {
		const currentRound = this.getCurrentRound();
		if (currentRound !== null && currentRound.getStatus() !== RoomStatus.Voting) {
			throw new RoomStatusNotValidError(currentRound.getStatus(), RoomStatus.Voting);
		}

		this.rounds.push(newRound);
	}

	public joinUser(user: User): void {
		const round = this.getCurrentRound();
		assert(round !== null, "Round must be created before joining a user");
		if (round.getStatus() !== RoomStatus.Waiting) {
			throw new RoomStatusNotValidError(round.getStatus(), RoomStatus.Waiting);
		}
		if (this.users.some((u) => u.id === user.id)) {
			throw new UserDupulicateError(user.id);
		}

		this.users.push(user);
	}

	public leaveUser(userId: string): void {
		const round = this.getCurrentRound();
		assert(round !== null, "Round must be created before joining a user");
		if (round.getStatus() !== RoomStatus.Waiting) {
			throw new RoomStatusNotValidError(round.getStatus(), RoomStatus.Waiting);
		}
		this.users = this.users.filter((u) => u.id !== userId);
	}
}
