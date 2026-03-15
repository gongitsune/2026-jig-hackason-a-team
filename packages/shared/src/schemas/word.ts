import * as v from "valibot";

export const WordSchema = v.pipe(
	v.string(),
	v.minLength(1, "単語は1文字以上で入力してください"),
	v.maxLength(10, "単語は10文字以下で入力してください"),
);
