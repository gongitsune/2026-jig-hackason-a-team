CREATE TABLE `rounds` (
	`id` text PRIMARY KEY,
	`roundNumber` integer NOT NULL,
	`status` text NOT NULL,
	`topic` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `sentences` (
	`writerId` text NOT NULL,
	`roundId` integer NOT NULL,
	`sentence` text NOT NULL,
	CONSTRAINT `sentences_pk` PRIMARY KEY(`writerId`, `roundId`),
	CONSTRAINT `fk_sentences_writerId_users_id_fk` FOREIGN KEY (`writerId`) REFERENCES `users`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_sentences_roundId_rounds_id_fk` FOREIGN KEY (`roundId`) REFERENCES `rounds`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY,
	`name` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `votes` (
	`voterId` text NOT NULL,
	`roundId` integer NOT NULL,
	`targetId` text NOT NULL,
	CONSTRAINT `votes_pk` PRIMARY KEY(`voterId`, `roundId`),
	CONSTRAINT `fk_votes_voterId_users_id_fk` FOREIGN KEY (`voterId`) REFERENCES `users`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_votes_roundId_rounds_id_fk` FOREIGN KEY (`roundId`) REFERENCES `rounds`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_votes_targetId_users_id_fk` FOREIGN KEY (`targetId`) REFERENCES `users`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `words` (
	`writerId` text NOT NULL,
	`roundId` integer NOT NULL,
	`word` text NOT NULL,
	CONSTRAINT `words_pk` PRIMARY KEY(`writerId`, `roundId`),
	CONSTRAINT `fk_words_writerId_users_id_fk` FOREIGN KEY (`writerId`) REFERENCES `users`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_words_roundId_rounds_id_fk` FOREIGN KEY (`roundId`) REFERENCES `rounds`(`id`) ON DELETE CASCADE
);
