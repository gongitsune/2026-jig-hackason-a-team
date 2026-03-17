import { RoomStatus } from "./api.js";

/**
 * 不正な操作が行われたときにスローされるエラー
 */
export class IllegalOperationError extends Error {
	constructor(message?: string) {
		super(message || "Illegal operation");
		this.name = "IllegalOperationError";
	}
}

/**
 * ユーザー重複エラー
 */
export class UserDupulicateError extends Error {
	constructor(userId: string) {
		super(`User with ID ${userId} already exists`);
		this.name = "UserDupulicateError";
	}
}

/**
 * 呼び出されたAPIが求める状態以外で呼び出された時にスローされるエラー
 */
export class RoomStatusNotValidError extends Error {
	constructor(expectedStatus: RoomStatus, actualStatus: RoomStatus) {
		super(`Expected room status: ${expectedStatus}, but actual room status: ${actualStatus}`);
		this.name = "RoomStatusNotValidError";
	}
}

/**
 * 送信された文字列の形式が不正な場合にスローされるエラー
 */
export class InvalidFormatError extends Error {
	constructor(message?: string) {
		super(message || "Invalid format");
		this.name = "InvalidFormatError";
	}
}

/**
 * 送信された単語が既に存在する場合にスローされるエラー
 */
export class WordDupulicateError extends Error {
	constructor(word: string) {
		super(`Word "${word}" already exists`);
		this.name = "WordDupulicateError";
	}
}

/**
 * ユーザーが既に単語を送信している場合にスローされるエラー
 */
export class UserAlreadySubmittedWordError extends Error {
	constructor(userId: string) {
		super(`User with ID ${userId} has already submitted a word`);
		this.name = "UserAlreadySubmittedWordError";
	}
}
