import { and, count, eq, desc } from "drizzle-orm";
import { DrizzleSqliteDODatabase } from "drizzle-orm/durable-sqlite";

import { roundsTable, sentencesTable, usersTable, votesTable, wordsTable } from "../../db/schema";
import { topics } from "../../resources/topics";
import { systemWords } from "../../resources/words";
import { User, UserId, UserName } from "../user/user";
import {
	GamePhase,
	ResultPhase,
	SentenceInputPhase,
	VotePhase,
	WaitingPhase,
	WordInputPhase,
} from "./value-objects/game-phase";
import { GameResult, UserResult } from "./value-objects/game-result";
import { Room, RoomCode } from "./value-objects/room";
import { RoundId } from "./value-objects/round";
import { Sentence } from "./value-objects/sentence";
import { Topic } from "./value-objects/topic";
import { Vote } from "./value-objects/vote";
import { SubmittedWord, Word } from "./value-objects/word";

export type RoomRepository = {
	load: (code: RoomCode) => Room;
	save: (room: Room) => void;
};

export const loadTopics = () => topics;
export const loadSystemWords = () => systemWords;

// oxlint-disable-next-line eslint/max-lines-per-function
export const makeRoomRepository = (db: DrizzleSqliteDODatabase): RoomRepository => {
	const load = (code: RoomCode): Room => {
		const users = db
			.select()
			.from(usersTable)
			.all()
			.map((u) => User(UserId(u.id), UserName(u.name)));

		const latestRound = db
			.select()
			.from(roundsTable)
			.orderBy(desc(roundsTable.roundNumber))
			.limit(1)
			.get();
		return Room(code, users, loadPhase(latestRound));
	};

	const save = (room: Room) => {
		db.insert(usersTable)
			.values(
				room.users.map((u) => ({
					id: u.id,
					name: u.name,
				})),
			)
			.onConflictDoNothing()
			.run();
		savePhase(room.phase);
	};

	// oxlint-disable-next-line eslint/max-lines-per-function
	const loadPhase = (latestRound: typeof roundsTable.$inferSelect | undefined): GamePhase => {
		switch (latestRound?.phase ?? "Waiting") {
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
				return VotePhase(RoundId(latestRound.id), Topic(latestRound.topic), submittedVotes);
			}
			case "Result": {
				if (!latestRound) throw new Error("No round found for Result phase");
				return ResultPhase(RoundId(latestRound.id));
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
						phase: "WordInputting",
					})
					.where(eq(roundsTable.id, phase.roundId))
					.run();
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
						phase: "SentenceInputting",
						distributedWords: JSON.stringify(phase.distributedWords),
					})
					.where(eq(roundsTable.id, phase.roundId))
					.run();
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
				db.update(roundsTable)
					.set({
						phase: "Voting",
					})
					.where(eq(roundsTable.id, phase.roundId))
					.run();
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
			case "Result": {
				db.update(roundsTable)
					.set({
						phase: "Result",
					})
					.where(eq(roundsTable.id, phase.roundId))
					.run();
			}
		}
	};

	return {
		load,
		save,
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
