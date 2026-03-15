import * as v from "valibot";

export const userIdSchema = v.pipe(v.string(), v.uuid("ユーザーIDはUUID形式で入力してください"));
export const userNameSchema = v.pipe(
	v.string(),
	v.minLength(1, "ユーザー名は1文字以上で入力してください"),
	v.maxLength(10, "ユーザー名は10文字以下で入力してください"),
);
export const userSchema = v.object({
	id: userIdSchema,
	name: userNameSchema,
});
