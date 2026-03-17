import { RoomStatus } from "@ichibun/shared/api";
import { RoomStatusNotValidError, UserDupulicateError } from "@ichibun/shared/error";
import { PassphraseSchema } from "@ichibun/shared/schemas/room";
import { UserIdSchema } from "@ichibun/shared/schemas/user";
import * as v from "valibot";

export class Room {
	constructor(
		public readonly passphrase: string,
		private status: RoomStatus,
		private users: string[],
	) {}

	public static create(passphrase: string, status: RoomStatus, users: string[]): Room {
		v.assert(PassphraseSchema, passphrase);
		v.assert(v.array(UserIdSchema), users);

		return new Room(passphrase, status, users);
	}

	public joinUser(userId: string): void {
		if (this.status !== RoomStatus.Waiting) {
			throw new RoomStatusNotValidError(this.status, RoomStatus.Waiting);
		}
		if (this.users.includes(userId)) {
			throw new UserDupulicateError(userId);
		}

		this.users.push(userId);
	}

	public leaveUser(userId: string): void {
		if (this.status !== RoomStatus.Waiting) {
			throw new RoomStatusNotValidError(this.status, RoomStatus.Waiting);
		}
		this.users = this.users.filter((id) => id !== userId);
	}

	public gotoWordInputting(): void {
		if (this.status !== RoomStatus.Waiting) {
			throw new RoomStatusNotValidError(this.status, RoomStatus.Waiting);
		}

		this.status = RoomStatus.WordInputing;
	}

	public gotoSentenceInputting(): void {
		if (this.status !== RoomStatus.WordInputing) {
			throw new RoomStatusNotValidError(this.status, RoomStatus.WordInputing);
		}

		this.status = RoomStatus.SentenceInputing;
	}

	public gotoVoting(): void {
		if (this.status !== RoomStatus.SentenceInputing) {
			throw new RoomStatusNotValidError(this.status, RoomStatus.SentenceInputing);
		}

		this.status = RoomStatus.Voting;
	}
}
