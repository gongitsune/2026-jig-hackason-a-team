import * as v from "valibot";
import assert from "assert";
import { User, UserSchema } from "@ichibun/shared/schemas/user";

export class UserRepository {
	private storage: DurableObjectStorage;

	constructor(storage: DurableObjectStorage) {
		this.storage = storage;
	}

	async getUser(userId: string): Promise<User | null> {
		const user = await this.storage.get(`user:${userId}`);
		if (user) {
			assert(v.is(UserSchema, user), "Invalid user data in storage");
			return user;
		}
		return null;
	}

	async deleteUser(userId: string): Promise<boolean> {
		return await this.storage.delete(`user:${userId}`);
	}

	async saveUser(user: User): Promise<void> {
		assert(v.is(UserSchema, user), "Invalid user object");
		await this.storage.put(`user:${user.id}`, user);
	}
}
