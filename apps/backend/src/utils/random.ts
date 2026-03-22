export const shuffleArray = <T>(array: T[]): T[] => {
	const shuffled = [...array];
	for (let i = shuffled.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
	}
	return shuffled;
};

export const sampleN = <T>(array: T[], n: number): T[] => {
	if (n > array.length) {
		throw new Error("Sample size cannot be larger than the array length");
	}
	const shuffled = shuffleArray(array);
	return shuffled.slice(0, n);
};
