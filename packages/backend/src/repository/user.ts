import * as v from "valibot";
import { User } from "@backend/domain/user.js";
import { UserIdSchema, UserNameSchema } from "@ichibun/shared/schemas/user";

const Schema = v.object({
	id: UserIdSchema,
	name: UserNameSchema,
});

export class UserRepository {
	private storage: DurableObjectStorage;

	constructor(storage: DurableObjectStorage) {
		this.storage = storage;
	}

	public async getUser(userId: string): Promise<User | null> {
		const user = await this.storage.get(`user:${userId}`);
		if (user && v.is(Schema, user)) {
			return new User(user.id, user.name);
		}
		return null;
	}

	public async deleteUser(userId: string): Promise<boolean> {
		return await this.storage.delete(`user:${userId}`);
	}

	public async saveUser(user: User): Promise<void> {
		await this.storage.put(`user:${user.id}`, {
			id: user.id,
			name: user.getName(),
		});
	}
}
