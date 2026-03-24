import * as v from "valibot";

export const UserIdSchema = v.pipe(v.string(), v.uuid(), v.brand("UserId"));
export const UserNameSchema = v.pipe(
	v.string(),
	v.minLength(1),
	v.maxLength(20),
	v.brand("UserName"),
);
export const UserSchema = v.pipe(
	v.object({
		id: UserIdSchema,
		name: UserNameSchema,
	}),
	v.readonly(),
	v.brand("User"),
);

export type UserId = v.InferOutput<typeof UserIdSchema>;
export type UserName = v.InferOutput<typeof UserNameSchema>;
export type User = v.InferOutput<typeof UserSchema>;

export const UserId = (id: string): UserId => {
	return v.parse(UserIdSchema, id);
};

export const UserName = (name: string): UserName => {
	return v.parse(UserNameSchema, name);
};

export const User = (id: UserId, name: UserName): User => {
	return v.parse(UserSchema, { id, name });
};
