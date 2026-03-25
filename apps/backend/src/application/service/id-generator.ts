import { nanoid } from "nanoid";

export type IdGenerator = {
	generate: () => string;
};
export const IdGenerator = (): IdGenerator => ({
	generate: () => {
		return nanoid();
	},
});
