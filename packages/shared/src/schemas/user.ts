import * as v from "valibot";

export const UserIdSchema = v.pipe(v.string(), v.uuid("ユーザーIDはUUID形式で入力してください"));
export const UserNameSchema = v.pipe(
	v.string(),
	v.minLength(1, "ユーザー名は1文字以上で入力してください"),
	v.maxLength(10, "ユーザー名は10文字以下で入力してください"),
);
export const UserSchema = v.object({
	id: UserIdSchema,
	name: UserNameSchema,
});

export type User = v.InferInput<typeof UserSchema>;
