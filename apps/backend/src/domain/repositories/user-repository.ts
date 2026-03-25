import { eq } from "drizzle-orm";
import { DrizzleSqliteDODatabase } from "drizzle-orm/durable-sqlite";

import { usersTable } from "../../db/schema";
import { User, UserId } from "../models/entities/user";

export type UserRepository = {
	insertUser: (user: User) => void;
	deleteUser: (userId: UserId) => void;
};

export const makeUserRepository = (db: DrizzleSqliteDODatabase): UserRepository => {
	const insertUser = (user: User) => {
		db.insert(usersTable)
			.values({
				id: user.id,
				name: user.name,
			})
			.run();
	};

	const deleteUser = (userId: UserId) => {
		db.delete(usersTable).where(eq(usersTable.id, userId)).run();
	};

	return {
		insertUser,
		deleteUser,
	};
};
