import { Sentence } from "@backend/domain/sentence";
import { User } from "@backend/domain/user";
import { UserWord } from "@backend/domain/word";
import { AppState } from "@backend/state";
import { RoomStatus } from "@ichibun/shared/api";
import {
	IllegalOperationError,
	InternalServerError,
	InvalidFormatError,
	RoomStatusNotValidError,
	UserDupulicateError,
	WordDupulicateError,
} from "@ichibun/shared/error";
import { PassphraseSchema } from "@ichibun/shared/schemas/room";
import { SentenceSchema } from "@ichibun/shared/schemas/sentence";
import { UserIdSchema, UserNameSchema } from "@ichibun/shared/schemas/user";
import { WordSchema } from "@ichibun/shared/schemas/word";
import { Hono } from "hono";
import * as v from "valibot";

const errorToStatus = (error: unknown): number => {
	if (error instanceof UserDupulicateError) return 409;
	if (error instanceof RoomStatusNotValidError) return 400;
	if (error instanceof InvalidFormatError) return 400;
	if (error instanceof WordDupulicateError) return 409;
	if (error instanceof IllegalOperationError) return 400;
	if (error instanceof InternalServerError) return 500;
	if (error instanceof v.ValiError) return 400;
	return 500;
};

const errorToMessage = (error: unknown): string => {
	if (error instanceof v.ValiError) {
		return error.issues.map((issue) => issue.message).join(", ");
	}
	if (error instanceof Error) return error.message;
	return "Unknown error";
};

// Request body schemas
const JoinSchema = v.object({
	userId: UserIdSchema,
	userName: UserNameSchema,
});

type JoinInput = v.InferOutput<typeof JoinSchema>;

const WordSubmitSchema = v.object({
	userId: UserIdSchema,
	word: WordSchema,
});

type WordSubmitInput = v.InferOutput<typeof WordSubmitSchema>;

const SentenceSubmitSchema = v.object({
	userId: UserIdSchema,
	sentence: SentenceSchema,
});

type SentenceSubmitInput = v.InferOutput<typeof SentenceSubmitSchema>;

const VoteSubmitSchema = v.object({
	userId: UserIdSchema,
	sentenceUserId: UserIdSchema,
});

type VoteSubmitInput = v.InferOutput<typeof VoteSubmitSchema>;

const handleJoin = async (c: any, appState: AppState) => {
	const body = await c.req.json();
	const validatedData = v.parse(JoinSchema, body) as JoinInput;

	const userRepository = appState.userRepository;

	if (userRepository.findUserById(validatedData.userId)) {
		throw new UserDupulicateError(validatedData.userId);
	}

	const user = User.create(validatedData.userId, validatedData.userName);
	userRepository.insertUser(user);

	const round = appState.roundRepository.getCurrentRound();
	if (!round) {
		const { Round: RoundClass } = await import("@backend/domain/round");
		appState.roundRepository.insertRound(RoundClass.create(1));
	}

	return c.json({ userId: user.id, userName: user.getName() }, 200);
};

const handleGetStatus = (c: any, appState: AppState) => {
	const round = appState.roundRepository.getCurrentRound();
	if (!round) {
		throw new InternalServerError("No round found");
	}
	return c.json({ status: round.getStatus() }, 200);
};

const handleGetTopic = (c: any, appState: AppState) => {
	const round = appState.roundRepository.getCurrentRound();
	if (!round) {
		throw new InternalServerError("No round found");
	}
	return c.json({ topic: round.topic.text }, 200);
};

const handleGetUsers = (c: any, appState: AppState) => {
	const round = appState.roundRepository.getCurrentRound();
	if (!round || round.getStatus() !== RoomStatus.Waiting) {
		throw new RoomStatusNotValidError(RoomStatus.Waiting, round?.getStatus() ?? RoomStatus.Waiting);
	}
	const usersWithPoint = appState.userRepository.findAllUsersWithPoint();
	return c.json(
		usersWithPoint.map(({ user, point }) => ({
			userId: user.id,
			name: user.getName(),
			point,
		})),
		200,
	);
};

const handleStartGame = (c: any, appState: AppState) => {
	const round = appState.roundRepository.getCurrentRound();
	if (!round || round.getStatus() !== RoomStatus.Waiting) {
		throw new RoomStatusNotValidError(RoomStatus.Waiting, round?.getStatus() ?? RoomStatus.Waiting);
	}
	round.gotoWordInputting();
	appState.roundRepository.updateRound(round);
	return c.json({ success: true }, 200);
};

const handleSubmitWord = async (c: any, appState: AppState) => {
	const body = await c.req.json();
	const validatedData = v.parse(WordSubmitSchema, body) as WordSubmitInput;

	const round = appState.roundRepository.getCurrentRound();

	if (!round || round.getStatus() !== RoomStatus.WordInputing) {
		throw new RoomStatusNotValidError(
			RoomStatus.WordInputing,
			round?.getStatus() ?? RoomStatus.Waiting,
		);
	}

	const user = appState.userRepository.findUserById(validatedData.userId);
	if (!user) throw new InternalServerError("User not found");

	const wordRepository = appState.wordRepository;
	if (wordRepository.getUserWordByUserId(round, validatedData.userId)) {
		throw new IllegalOperationError("User has already submitted a word");
	}

	const newUserWord = UserWord.create(validatedData.word, validatedData.userId, round.id);
	wordRepository.addUserWord(newUserWord);

	const notSubmittedUserCount = wordRepository.countNotSubmittedUser(round);
	if (notSubmittedUserCount === 0) {
		const userWords = wordRepository.getUserWords(round);
		round.gotoSentenceInputting(userWords);
		appState.roundRepository.updateRound(round);
	}

	return c.json({ success: true }, 200);
};

const handleSubmitSentence = async (c: any, appState: AppState) => {
	const body = await c.req.json();
	const validatedData = v.parse(SentenceSubmitSchema, body) as SentenceSubmitInput;

	const round = appState.roundRepository.getCurrentRound();

	if (!round || round.getStatus() !== RoomStatus.SentenceInputing) {
		throw new RoomStatusNotValidError(
			RoomStatus.SentenceInputing,
			round?.getStatus() ?? RoomStatus.Waiting,
		);
	}

	const user = appState.userRepository.findUserById(validatedData.userId);
	if (!user) throw new InternalServerError("User not found");

	const sentenceRepository = appState.sentenceRepository;
	if (sentenceRepository.getSentenceByUserId(round.id, validatedData.userId)) {
		throw new IllegalOperationError("User has already submitted a sentence");
	}

	const newSentence = Sentence.create(user, validatedData.sentence, round.id);
	sentenceRepository.addSentence(newSentence);

	const notSubmittedUserCount = sentenceRepository.countNotSubmittedUser(round.id);
	if (notSubmittedUserCount === 0) {
		round.gotoVoting();
		appState.roundRepository.updateRound(round);
	}

	return c.json({ success: true }, 200);
};

const handleSubmitVote = async (c: any, appState: AppState) => {
	const body = await c.req.json();
	const validatedData = v.parse(VoteSubmitSchema, body) as VoteSubmitInput;

	const round = appState.roundRepository.getCurrentRound();

	if (!round || round.getStatus() !== RoomStatus.Voting) {
		throw new RoomStatusNotValidError(RoomStatus.Voting, round?.getStatus() ?? RoomStatus.Waiting);
	}

	const user = appState.userRepository.findUserById(validatedData.userId);
	if (!user) throw new InternalServerError("User not found");

	const voteRepository = appState.voteRepository;

	const vote = new (await import("@backend/domain/vote")).Vote(validatedData.userId, 0, round.id);
	voteRepository.insertVote(vote);

	return c.json({ success: true }, 200);
};

const handleGetWords = (c: any, appState: AppState) => {
	const round = appState.roundRepository.getCurrentRound();
	if (!round) {
		throw new InternalServerError("No round found");
	}

	const status = round.getStatus();
	if (status !== RoomStatus.SentenceInputing && status !== RoomStatus.Voting) {
		throw new RoomStatusNotValidError(RoomStatus.SentenceInputing, status);
	}

	const words = round.getWords();
	if (!words) {
		throw new InternalServerError("No distributed words found");
	}

	return c.json(
		words.words.map((w) => w.word),
		200,
	);
};

const handleGetSentencesToVote = (c: any, appState: AppState) => {
	const round = appState.roundRepository.getCurrentRound();
	if (!round) {
		throw new InternalServerError("No round found");
	}

	if (round.getStatus() !== RoomStatus.Voting) {
		throw new RoomStatusNotValidError(RoomStatus.Voting, round.getStatus());
	}

	const sentences = appState.sentenceRepository.getSentencesByRoundId(round.id);
	const result = sentences.map((s) => ({
		userName: s.user.getName(),
		sentence: s.sentence,
	}));

	return c.json(result, 200);
};

const handleGetResult = (c: any, appState: AppState) => {
	const round = appState.roundRepository.getCurrentRound();
	if (!round || round.getStatus() !== RoomStatus.Waiting) {
		throw new RoomStatusNotValidError(RoomStatus.Waiting, round?.getStatus() ?? RoomStatus.Waiting);
	}

	const results = appState.gameResultRepository.getLastResult(round.id - 1);
	return c.json(results || null, 200);
};

export const createRoomRouter = (appState: AppState) => {
	const router = new Hono();

	router.use("/:passphrase/*", async (c, next) => {
		try {
			const passphrase = c.req.param("passphrase");
			v.assert(PassphraseSchema, passphrase);
			await next();
		} catch (error) {
			const status = errorToStatus(error) as any;
			return c.json({ error: errorToMessage(error) }, status);
		}
	});

	router.post("/:passphrase/join", async (c) => {
		try {
			return await handleJoin(c, appState);
		} catch (error) {
			const status = errorToStatus(error) as any;
			return c.json({ error: errorToMessage(error) }, status);
		}
	});

	router.get("/:passphrase/status", (c) => {
		try {
			return handleGetStatus(c, appState);
		} catch (error) {
			const status = errorToStatus(error) as any;
			return c.json({ error: errorToMessage(error) }, status);
		}
	});

	router.get("/:passphrase/topic", (c) => {
		try {
			return handleGetTopic(c, appState);
		} catch (error) {
			const status = errorToStatus(error) as any;
			return c.json({ error: errorToMessage(error) }, status);
		}
	});

	router.get("/:passphrase/users", (c) => {
		try {
			return handleGetUsers(c, appState);
		} catch (error) {
			const status = errorToStatus(error) as any;
			return c.json({ error: errorToMessage(error) }, status);
		}
	});

	router.post("/:passphrase/game/start", (c) => {
		try {
			return handleStartGame(c, appState);
		} catch (error) {
			const status = errorToStatus(error) as any;
			return c.json({ error: errorToMessage(error) }, status);
		}
	});

	router.post("/:passphrase/word", async (c) => {
		try {
			return await handleSubmitWord(c, appState);
		} catch (error) {
			const status = errorToStatus(error) as any;
			return c.json({ error: errorToMessage(error) }, status);
		}
	});

	router.post("/:passphrase/sentence", async (c) => {
		try {
			return await handleSubmitSentence(c, appState);
		} catch (error) {
			const status = errorToStatus(error) as any;
			return c.json({ error: errorToMessage(error) }, status);
		}
	});

	router.post("/:passphrase/vote", async (c) => {
		try {
			return await handleSubmitVote(c, appState);
		} catch (error) {
			const status = errorToStatus(error) as any;
			return c.json({ error: errorToMessage(error) }, status);
		}
	});

	router.get("/:passphrase/words", (c) => {
		try {
			return handleGetWords(c, appState);
		} catch (error) {
			const status = errorToStatus(error) as any;
			return c.json({ error: errorToMessage(error) }, status);
		}
	});

	router.get("/:passphrase/sentences-to-vote", (c) => {
		try {
			return handleGetSentencesToVote(c, appState);
		} catch (error) {
			const status = errorToStatus(error) as any;
			return c.json({ error: errorToMessage(error) }, status);
		}
	});

	router.get("/:passphrase/result", (c) => {
		try {
			return handleGetResult(c, appState);
		} catch (error) {
			const status = errorToStatus(error) as any;
			return c.json({ error: errorToMessage(error) }, status);
		}
	});

	return router;
};
