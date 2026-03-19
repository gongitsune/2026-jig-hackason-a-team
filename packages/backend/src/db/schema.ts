import { sqliteTable, text, int } from "drizzle-orm/sqlite-core";

export const usersTable = sqliteTable("users", {
	id: text({ length: 36 }).primaryKey(),
	name: text().notNull(),
});

export const wordsTable = sqliteTable("words", {
	id: int().primaryKey({ autoIncrement: true }),
	word: text().notNull(),
	writerId: text({ length: 36 }).notNull(),
	roundId: int().notNull(),
});

export const sentencesTable = sqliteTable("sentences", {
	id: int().primaryKey({ autoIncrement: true }),
	sentence: text().notNull(),
	writerId: text({ length: 36 }).notNull(),
	roundId: int().notNull(),
});

export const votesTable = sqliteTable("votes", {
	id: int().primaryKey({ autoIncrement: true }),
	sentenceId: int().notNull(),
	voterId: text({ length: 36 }).notNull(),
	roundId: int().notNull(),
});

export const roundsTable = sqliteTable("rounds", {
	id: int().primaryKey(),
	status: int().notNull(),
	topic: text().notNull(),
	distributedWords: text(),
});
