import { Round } from "@backend/domain/round";
import { User } from "@backend/domain/user";
import { AppState } from "@backend/state";
import { PublicAPI, RoomAPI } from "@ichibun/shared/api";
import { UserDupulicateError } from "@ichibun/shared/error";

import { RoomApiImpl } from "./roomApi";

export class PublicApiImpl implements PublicAPI {
	constructor(private readonly state: AppState) {}

	joinRoom(userId: string, userName: string): RoomAPI {
		const userRepository = this.state.userRepository;

		if (userRepository.findUserById(userId)) {
			throw new UserDupulicateError(userId);
		}

		const user = User.create(userId, userName);
		userRepository.insertUser(user);

		// ラウンドがない場合は新しいラウンドを作成する
		const round = this.state.roundRepository.getCurrentRound();
		if (!round) {
			this.state.roundRepository.insertRound(Round.create(1));
		}
		return new RoomApiImpl(this.state, user);
	}
}
