import * as v from "valibot";

export const passphraseSchema = v.pipe(
	v.string(),
	v.minLength(1, "パスフレーズは4文字以上で入力してください"),
	v.maxLength(20, "パスフレーズは20文字以下で入力してください"),
);
