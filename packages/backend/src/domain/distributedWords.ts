import { words as systemWords } from "@backend/resources/words";

import { SystemWord, UserWord } from "./word";

function sampleN<T>(arr: T[], n: number): T[] {
	const copy = [...arr];
	for (let i = copy.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[copy[i], copy[j]] = [copy[j], copy[i]];
	}
	return copy.slice(0, n);
}

export class DistributedWords {
	private static readonly WordCount = 10;

	constructor(public readonly words: SystemWord[]) {}

	public static create(userWords: UserWord[]): DistributedWords {
		const allWords = [
			...userWords.map((w) => new SystemWord(w.word)),
			...systemWords.map((w) => new SystemWord(w)),
		];
		const words = sampleN(allWords, DistributedWords.WordCount);

		return new DistributedWords(words);
	}
}
