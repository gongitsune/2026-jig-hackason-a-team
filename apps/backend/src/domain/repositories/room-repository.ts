import { and, count, eq, desc } from "drizzle-orm";
import { DrizzleSqliteDODatabase } from "drizzle-orm/durable-sqlite";

import {
	roomsTable,
	roundsTable,
	sentencesTable,
	usersTable,
	votesTable,
	wordsTable,
} from "../../db/schema";
import { topics } from "../../resources/topics";
import { systemWords } from "../../resources/words";
import { Room, RoomCode } from "../models/entities/room";
import { Round, RoundId } from "../models/entities/round";
import { Sentence } from "../models/entities/sentence";
import { User, UserId, UserName } from "../models/entities/user";
import { Vote } from "../models/entities/vote";
import { SubmittedWord, Word } from "../models/entities/word";
import {
	GamePhase,
	SentenceInputPhase,
	VotePhase,
	WaitingPhase,
	WordInputPhase,
} from "../models/values/game-phase";
import { GameResult, UserResult } from "../models/values/game-result";
import { Topic } from "../models/values/topic";

export type RoomRepository = {
	load: (code: RoomCode) => Room;
	save: (room: Room) => void;
	createRoom: (code: RoomCode) => void;
	insertRound: (round: Round) => void;
	findRoundById: (roundId: RoundId) => Round | undefined;
};

export const loadTopics = () => topics.map(Topic);
export const loadSystemWords = () => systemWords.map(Word);

// oxlint-disable-next-line eslint/max-lines-per-function
export const makeRoomRepository = (db: DrizzleSqliteDODatabase): RoomRepository => {
	const load = (code: RoomCode): Room => {
		const users = db
			.select()
			.from(usersTable)
			.all()
			.map((u) => User(UserId(u.id), UserName(u.name)));

		const room = db.select().from(roomsTable).where(eq(roomsTable.code, code)).get();
		if (!room) throw new Error("Room not found");

		const latestRound = db
			.select()
			.from(roundsTable)
			.orderBy(desc(roundsTable.roundNumber))
			.limit(1)
			.get();
		return Room(code, users, loadPhase(latestRound, room?.phase));
	};

	const save = (room: Room) => {
		db.update(roomsTable)
			.set({
				phase: room.phase.tag,
			})
			.where(eq(roomsTable.code, room.code))
			.run();
		savePhase(room.phase);
	};

	const createRoom = (code: RoomCode) => {
		db.insert(roomsTable)
			.values({
				code,
				phase: "Waiting",
			})
			.onConflictDoNothing()
			.run();
	};

	const insertRound = (round: Round) => {
		db.insert(roundsTable)
			.values({
				id: round.id,
				roundNumber: round.roundNumber,
				topic: round.topic,
			})
			.run();
	};

	const findRoundById = (roundId: RoundId): Round | undefined => {
		const round = db.select().from(roundsTable).where(eq(roundsTable.id, roundId)).get();
		if (!round) return undefined;
		return Round(RoundId(roundId), round.roundNumber, Topic(round.topic));
	};

	// oxlint-disable-next-line eslint/max-lines-per-function
	const loadPhase = (
		latestRound: typeof roundsTable.$inferSelect | undefined,
		phase: GamePhase["tag"],
	): GamePhase => {
		switch (phase ?? "Waiting") {
			case "Waiting": {
				if (!latestRound) return WaitingPhase();
				return WaitingPhase(buildGameResult(db, latestRound));
			}
			case "WordInputting": {
				if (!latestRound) throw new Error("No round found for WordInputting phase");
				const submittedWords = db
					.select()
					.from(wordsTable)
					.where(eq(wordsTable.roundId, latestRound.id))
					.all()
					.map((r) => SubmittedWord(UserId(r.writerId), RoundId(r.roundId), Word(r.word)));
				return WordInputPhase(RoundId(latestRound.id), Topic(latestRound.topic), submittedWords);
			}
			case "SentenceInputting": {
				if (!latestRound) throw new Error("No round found for SentenceInputting phase");
				if (!latestRound.distributedWords)
					throw new Error("No distributed words found for SentenceInputting phase");
				const submittedSentences = db
					.select()
					.from(sentencesTable)
					.where(eq(sentencesTable.roundId, latestRound.id))
					.all()
					.map((r) => Sentence(UserId(r.writerId), RoundId(r.roundId), r.sentence));
				const distributedWords = JSON.parse(latestRound.distributedWords) as string[];
				return SentenceInputPhase(
					RoundId(latestRound.id),
					Topic(latestRound.topic),
					distributedWords.map((w) => Word(w)),
					submittedSentences,
				);
			}
			case "Voting": {
				if (!latestRound) throw new Error("No round found for Voting phase");
				const submittedVotes = db
					.select()
					.from(votesTable)
					.where(eq(votesTable.roundId, latestRound.id))
					.all()
					.map((r) => Vote(UserId(r.voterId), RoundId(r.roundId), UserId(r.targetId)));
				const sentences = db
					.select()
					.from(sentencesTable)
					.where(eq(sentencesTable.roundId, latestRound.id))
					.all()
					.map((r) => Sentence(UserId(r.writerId), RoundId(r.roundId), r.sentence));
				return VotePhase(
					RoundId(latestRound.id),
					Topic(latestRound.topic),
					sentences,
					submittedVotes,
				);
			}
		}
	};

	// oxlint-disable-next-line eslint/max-lines-per-function
	const savePhase = (phase: GamePhase) => {
		switch (phase.tag) {
			case "Waiting": {
				break;
			}
			case "WordInputting": {
				db.update(roundsTable)
					.set({
						topic: phase.topic,
					})
					.where(eq(roundsTable.id, phase.roundId))
					.run();

				if (phase.submitted.length > 0)
					db.insert(wordsTable)
						.values(
							phase.submitted.map((w) => ({
								writerId: w.writerId,
								roundId: w.roundId,
								word: w.word,
							})),
						)
						.onConflictDoNothing()
						.run();
				break;
			}
			case "SentenceInputting": {
				db.update(roundsTable)
					.set({
						distributedWords: JSON.stringify(phase.distributedWords),
					})
					.where(eq(roundsTable.id, phase.roundId))
					.run();
				if (phase.submitted.length > 0)
					db.insert(sentencesTable)
						.values(
							phase.submitted.map((s) => ({
								writerId: s.writerId,
								roundId: s.roundId,
								sentence: s.text,
							})),
						)
						.onConflictDoNothing()
						.run();
				break;
			}
			case "Voting": {
				if (phase.submitted.length > 0)
					db.insert(votesTable)
						.values(
							phase.submitted.map((v) => ({
								voterId: v.voterId,
								roundId: v.roundId,
								targetId: v.targetId,
							})),
						)
						.onConflictDoNothing()
						.run();
				break;
			}
		}
	};

	return {
		load,
		save,
		createRoom,
		insertRound,
		findRoundById,
	};
};

const buildGameResult = (
	db: DrizzleSqliteDODatabase,
	latestRound: typeof roundsTable.$inferSelect,
) => {
	// リザルトを取得して構築
	const lastUserResults = db
		.select({
			userId: sentencesTable.writerId,
			userName: usersTable.name,
			sentence: sentencesTable.sentence,
			voteCount: count(votesTable.voterId),
		})
		.from(sentencesTable)
		.where(eq(sentencesTable.roundId, latestRound.id))
		.innerJoin(
			votesTable,
			and(eq(votesTable.roundId, latestRound.id), eq(votesTable.targetId, sentencesTable.writerId)),
		)
		.innerJoin(usersTable, eq(usersTable.id, sentencesTable.writerId))
		.groupBy(sentencesTable.writerId)
		.all();

	return GameResult(
		latestRound.roundNumber,
		Topic(latestRound.topic),
		lastUserResults.map((r) =>
			UserResult(
				User(UserId(r.userId), UserName(r.userName)),
				Sentence(UserId(r.userId), RoundId(latestRound.id), r.sentence),
				r.voteCount,
			),
		),
	);
};
