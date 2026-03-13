/**
 * 不正な操作が行われたときにスローされるエラー
 */
export interface IllegalOperationError extends Error {}

/**
 * ユーザー重複エラー
 */
export interface UserDupulicateError extends Error {}

/**
 * 呼び出されたAPIが求める状態以外で呼び出された時にスローされるエラー
 */
export interface RoomStatusNotValidError extends Error {}

/**
 * 送信された文字列の形式が不正な場合にスローされるエラー
 */
export interface InvalidFormatError extends Error {}

/**
 * 送信された単語が既に存在する場合にスローされるエラー
 */
export interface WordDupulicateError extends Error {}
