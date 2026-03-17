import { Word } from "./word.js";

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

	constructor(private readonly words: Word[]) {}

	public static create(allWords: Word[]): DistributedWords {
		const words = sampleN(allWords, DistributedWords.WordCount);

		return new DistributedWords(words);
	}

	public getWords(): ReadonlyArray<Word> {
		return this.words;
	}
}
