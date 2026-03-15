import * as v from "valibot";

export const sentenceSchema = v.pipe(
	v.string(),
	v.minLength(1, "1文字以上入力してください"),
	v.maxLength(30, "30文字以下で入力してください"),
);
