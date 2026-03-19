CREATE TABLE `rounds` (
	`id` integer PRIMARY KEY,
	`status` integer NOT NULL,
	`topic` text NOT NULL,
	`distributedWords` text
);
--> statement-breakpoint
CREATE TABLE `sentences` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`sentence` text NOT NULL,
	`writerId` text(36) NOT NULL,
	`roundId` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text(36) PRIMARY KEY,
	`name` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `votes` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`sentenceId` integer NOT NULL,
	`voterId` text(36) NOT NULL,
	`roundId` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `words` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`word` text NOT NULL,
	`writerId` text(36) NOT NULL,
	`roundId` integer NOT NULL
);
