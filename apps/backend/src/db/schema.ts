import { int, primaryKey, sqliteTable, text } from "drizzle-orm/sqlite-core";

import { RoundStatusList } from "../domain/room/value-objects/round";

export const usersTable = sqliteTable("users", {
	id: text().primaryKey(),
	name: text().notNull(),
});

export const wordsTable = sqliteTable(
	"words",
	{
		writerId: text()
			.notNull()
			.references(() => usersTable.id, { onDelete: "cascade" }),
		roundId: int()
			.notNull()
			.references(() => roundsTable.id, { onDelete: "cascade" }),
		word: text().notNull(),
	},
	(table) => [primaryKey({ columns: [table.writerId, table.roundId] })],
);

export const sentencesTable = sqliteTable(
	"sentences",
	{
		writerId: text()
			.notNull()
			.references(() => usersTable.id, { onDelete: "cascade" }),
		roundId: int()
			.notNull()
			.references(() => roundsTable.id, { onDelete: "cascade" }),
		sentence: text().notNull(),
	},
	(table) => [primaryKey({ columns: [table.writerId, table.roundId] })],
);

export const votesTable = sqliteTable(
	"votes",
	{
		voterId: text()
			.notNull()
			.references(() => usersTable.id, { onDelete: "cascade" }),
		roundId: int()
			.notNull()
			.references(() => roundsTable.id, { onDelete: "cascade" }),
		targetId: text()
			.notNull()
			.references(() => usersTable.id, { onDelete: "cascade" }),
	},
	(table) => [primaryKey({ columns: [table.voterId, table.roundId] })],
);

export const roundsTable = sqliteTable("rounds", {
	id: text().primaryKey(),
	roundNumber: int().notNull(),
	status: text({ enum: RoundStatusList }).notNull(),
	topic: text().notNull(),
});
