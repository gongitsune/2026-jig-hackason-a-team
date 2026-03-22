import * as v from "valibot";

import { User, UserSchema } from "../../user/user";
import { GamePhase, GamePhaseSchema } from "./game-phase";

export const RoomCodeSchema = v.pipe(
	v.string(),
	v.minLength(1),
	v.maxLength(10),
	v.brand("RoomCode"),
);
export const RoomSchema = v.pipe(
	v.object({
		code: RoomCodeSchema,
		users: v.array(UserSchema),
		phase: GamePhaseSchema,
	}),
	v.readonly(),
	v.brand("Room"),
);

export type RoomCode = v.InferOutput<typeof RoomCodeSchema>;
export type Room = v.InferOutput<typeof RoomSchema>;

export const RoomCode = (code: string) => v.parse(RoomCodeSchema, code);
export const Room = (code: RoomCode, users: User[], phase: GamePhase) =>
	v.parse(RoomSchema, {
		code,
		users,
		phase,
	});

export const addUserToRoom = (room: Room, user: User): Room => {
	return {
		...room,
		users: [...room.users, user],
	};
};

export const removeUserFromRoom = (room: Room, user: User): Room => {
	return {
		...room,
		users: room.users.filter((u) => u.id !== user.id),
	};
};

export const updateRoomPhase = (room: Room, phase: GamePhase): Room => {
	return {
		...room,
		phase,
	};
};
