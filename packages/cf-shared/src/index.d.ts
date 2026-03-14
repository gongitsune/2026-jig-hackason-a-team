import { IllegalOperationError, InvalidFormatError, RoomStatusNotValidError, UserDupulicateError, WordDupulicateError } from "./error";

export * from "./error";

export interface PublicAPI {
	/**
	 * ユーザIDで認証して、認証に成功したらRoomAPIを返す。
	 * @param userId UUIDv4
	 * @returns 認証に成功したらRoomAPIを返す。
	 * @throws {UserDupulicateError} ユーザIDが重複している場合にスローされる。
	 */
	authenticate(userId: string, passphrase): Promise<RoomAPI>;
}

export interface RoomAPI {
	/**
	 * ルームの状態を取得する。
	 * @returns ルームの状態
	 */
	getRoomStatus(): Promise<RoomStatus>;

	/**
	 * 現在のお題を取得する。
	 * @returns 現在のお題
	 */
	getTopic(): Promise<string>;

	/**
	 * 前回のゲームの結果を取得する。前回のゲームが存在しない場合はnullを返す。
	 * Waiting状態でのみ許可される。
	 * @return 前回のゲームの結果。前回のゲームが存在しない場合はnull。
	 * @throws {RoomStatusNotValidError} ルームがゲーム結果を取得可能な状態ではない場合にスローされる。
	 */
	getLastResult(): Promise<GameResult | null>;

	/**
	 * ルームに参加しているユーザの情報を取得する。
	 * Waiting状態でのみ許可される。
	 * @returns ルームに参加しているユーザの情報のリスト
	 * @throws {RoomStatusNotValidError} ルームがユーザ情報を取得可能な状態ではない場合にスローされる。
	 **/
	getUsers(): Promise<UserInfo[]>;

	/**
	 * 配られた単語のリストを取得する。
	 * SentenceInputing状態とVoting状態でのみ許可される。
	 * @returns 配られた単語のリスト
	 * @throws {RoomStatusNotValidError} ルームが配られた単語を取得可能な状態ではない場合にスローされる。
	 */
	getDistributedWords(): Promise<string[]>;

	/**
	 * 投票する文章のリストを取得する。
	 * Voting状態でのみ許可される。
	 * @returns 投票する文章のリスト
	 * @throws {RoomStatusNotValidError} ルームが投票可能な状態ではない場合にスローされる。
	 */
	getSentencesToVote(): Promise<SentenceToVote[]>;

	/**
	 * ゲームを開始する。ゲームが開始されると、ルームはWordInputing状態になる。
	 * Waiting状態でのみ許可される。
	 * @throws {RoomStatusNotValidError} ルームが開始可能な状態ではない場合にスローされる。
	 */
	startGame(): Promise<void>;

	/**
	 *	単語を送信する。全員が送信すると、ルームはSentenceInputing状態になる。
	 *	WordInputing状態でのみ許可される。
	 *	次の状態に遷移するまでPromiseは解決されない。
	 *	@param word 送信する単語
	 *	@throws {RoomStatusNotValidError} ルームが単語入力可能な状態ではない場合にスローされる。
	 *	@throws {InvalidFormatError} 送信された単語の形式が不正な場合にスローされる。
	 *	@throws {WordDupulicateError} 送信された単語が既に存在する場合にスローされる。
	 *	@throws {IllegalOperationError} 単語を二回送信するなど不正な操作が行われるとスローされる。
	 */
	submitWord(word: string): Promise<void>;

	/**
	 * 文章を送信する。全員が送信すると、ルームはVoting状態になる。
	 * SentenceInputing状態でのみ許可される。
	 * 次の状態に遷移するまでPromiseは解決されない。
	 * @param sentence 送信する文章
	 * @throws {RoomStatusNotValidError} ルームが文章入力可能な状態ではない場合にスローされる。
	 * @throws {InvalidFormatError} 送信された文章の形式が不正な場合にスローされる。
	 * @throws {IllegalOperationError} 文章を二回送信するなど不正な操作が行われるとスローされる。
	 */
	submitSentence(sentence: string): Promise<void>;

	/**
	 * 指定したユーザの文章に投票する。全員が投票すると、ゲーム結果が確定し、ルームはWaiting状態になる。
	 * Voting状態でのみ許可される。
	 * 次の状態に遷移するまでPromiseは解決されない。
	 * @param sentenceUserId 投票する文章を送信したユーザのユーザID
	 * @throws {RoomStatusNotValidError} ルームが投票可能な状態ではない場合にスローされる。
	 * @throws {IllegalOperationError} 投票を二回行うなど不正な操作が行われるとスローされる。
	 */
	submitVote(sentenceUserId: string): Promise<void>;
}

export type UserInfo = {
	userId: string;
	name: string;
	point: number;
};

export type UserResult = {
	userId: string;
	sentence: string;
	voteCount: number;
};

export type GameResult = {
	topic: string;
	results: UserResult[];
};

export type SentenceToVote = {
	userId: string;
	sentence: string;
};

export enum RoomStatus {
	Waiting,
	WordInputing,
	SentenceInputing,
	Voting,
}
