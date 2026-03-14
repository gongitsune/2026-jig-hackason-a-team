import assert from "assert";
import { isValidUser, User } from "../domain/user";

export class UserRepository {
	private storage: DurableObjectStorage;

	constructor(storage: DurableObjectStorage) {
		this.storage = storage;
	}

	async getUser(userId: string): Promise<User | null> {
		const user = await this.storage.get(`user:${userId}`);
		if (user) {
			assert(isValidUser(user), "Invalid user data in storage");
			return user;
		}
		return null;
	}

	async deleteUser(userId: string): Promise<boolean> {
		return await this.storage.delete(`user:${userId}`);
	}

	async saveUser(user: User): Promise<void> {
		assert(isValidUser(user), "Invalid user object");
		await this.storage.put(`user:${user.userId}`, user);
	}
}
