import { Room } from "@backend/domain/room.js";
import { PublicAPI, RoomAPI } from "@ichibun/shared/api";
import { RoomApiImpl } from "./roomApi.js";
import { RoomStatusRepository } from "@backend/repository/roomStatus.js";
import { UserRepository } from "@backend/repository/user.js";
import { User } from "@backend/domain/user.js";

export class PublicApiImpl implements PublicAPI {
	constructor(
		private readonly env: Env,
		private readonly roomStatusRepository: RoomStatusRepository,
		private readonly userRepository: UserRepository,
	) {}

	async authenticate(userId: string, passphrase: string): Promise<RoomAPI> {
		const room = Room.create(passphrase, this.env);
		room.joinUser(userId);

		return new RoomApiImpl();
	}
}
