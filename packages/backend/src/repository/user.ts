import { count, eq } from "drizzle-orm";
import { DrizzleSqliteDODatabase } from "drizzle-orm/durable-sqlite";

import { sentencesTable, usersTable, votesTable } from "../db/schema";
import { User } from "../domain/user";

type UserWithPoint = {
	user: User;
	point: number;
};

export class UserRepository {
	constructor(private readonly db: DrizzleSqliteDODatabase) {}

	public insertUser(user: User): void {
		this.db.insert(usersTable).values({ id: user.id, name: user.getName() }).run();
	}

	public findUserById(userId: string): User | null {
		const user = this.db.select().from(usersTable).where(eq(usersTable.id, userId)).get();

		if (user) {
			return new User(user.id, user.name);
		}
		return null;
	}

	public findAllUsersWithPoint(): UserWithPoint[] {
		const users = this.db
			.select({
				id: usersTable.id,
				name: usersTable.name,
				point: count(votesTable.id),
			})
			.from(usersTable)
			.innerJoin(sentencesTable, eq(sentencesTable.writerId, usersTable.id))
			.innerJoin(votesTable, eq(votesTable.sentenceId, sentencesTable.id))
			.groupBy(usersTable.id)
			.all();
		return users.map((user) => ({
			user: new User(user.id, user.name),
			point: user.point,
		}));
	}

	public deleteUserById(userId: string): boolean {
		const res = this.db.delete(usersTable).where(eq(usersTable.id, userId)).run();
		return res.rowsWritten > 0;
	}

	public updateUser(userId: string, newUser: User): boolean {
		const res = this.db
			.update(usersTable)
			.set({ name: newUser.getName() })
			.where(eq(usersTable.id, userId))
			.run();
		return res.rowsWritten > 0;
	}
}
