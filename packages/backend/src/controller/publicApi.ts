import { PublicAPI, RoomAPI } from "@ichibun/shared/api";
import { UserDupulicateError } from "@ichibun/shared/error";
import { RpcTarget } from "capnweb";

import { Round } from "../domain/round";
import { User } from "../domain/user";
import { AppState } from "../state";
import { RoomApiImpl } from "./roomApi";

export class PublicApiImpl extends RpcTarget implements PublicAPI {
	constructor(private readonly state: AppState) {
		super();
	}

	healthCheck(): string {
		console.log("Health check");
		return "OK";
	}

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
