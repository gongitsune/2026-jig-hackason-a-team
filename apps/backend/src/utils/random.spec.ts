import { describe, expect, it } from "vitest";

import { sampleN, shuffleArray } from "./random";

describe("random", () => {
	it("シャッフルする", () => {
		const array = [1, 2, 3, 4, 5];
		const shuffled = shuffleArray(array);

		expect(shuffled.sort()).toEqual(array.sort());
		expect(shuffled.length).toBe(array.length);
	});

	it("N個サンプルする", () => {
		const array = [1, 2, 3, 4, 5];
		const sample = sampleN(array, 3);

		expect(sample.length).toBe(3);
		sample.forEach((item) => {
			expect(array).toContain(item);
		});
	});

	it("サンプルサイズが配列の長さより大きい場合、エラーを投げる", () => {
		const array = [1, 2, 3];
		expect(() => sampleN(array, 5)).toThrow("Sample size cannot be larger than the array length");
	});
});
