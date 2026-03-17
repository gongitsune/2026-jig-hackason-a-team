import { UserIdSchema, UserNameSchema } from "@ichibun/shared/schemas/user";
import * as v from "valibot";

export class User {
	constructor(
		public readonly id: string,
		private name: string,
	) {}

	public static create(id: string, name: string): User {
		v.assert(UserIdSchema, id);
		v.assert(UserNameSchema, name);

		return new User(id, name);
	}

	public getName(): string {
		return this.name;
	}

	public changeName(newName: string) {
		this.name = v.parse(UserNameSchema, newName);
	}
}
