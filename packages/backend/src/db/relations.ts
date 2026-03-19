import { defineRelations } from "drizzle-orm";

import * as schemas from "./schema";

export const relations = defineRelations(schemas, (r) => ({
	usersTable: {
		words: r.many.wordsTable({
			from: r.usersTable.id,
			to: r.wordsTable.writerId,
		}),
		sentences: r.many.sentencesTable({
			from: r.usersTable.id,
			to: r.sentencesTable.writerId,
		}),
		votes: r.many.votesTable({
			from: r.usersTable.id,
			to: r.votesTable.voterId,
		}),
	},
	wordsTable: {
		user: r.one.usersTable({
			from: r.wordsTable.writerId,
			to: r.usersTable.id,
		}),
		round: r.one.roundsTable({
			from: r.wordsTable.roundId,
			to: r.roundsTable.id,
		}),
	},
	sentencesTable: {
		user: r.one.usersTable({
			from: r.sentencesTable.writerId,
			to: r.usersTable.id,
		}),
		round: r.one.roundsTable({
			from: r.sentencesTable.roundId,
			to: r.roundsTable.id,
		}),
	},
	votesTable: {
		user: r.one.usersTable({
			from: r.votesTable.voterId,
			to: r.usersTable.id,
		}),
		sentence: r.one.sentencesTable({
			from: r.votesTable.sentenceId,
			to: r.sentencesTable.id,
		}),
		round: r.one.roundsTable({
			from: r.votesTable.roundId,
			to: r.roundsTable.id,
		}),
	},
}));
