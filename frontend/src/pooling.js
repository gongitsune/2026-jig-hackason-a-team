import { API } from "./api.js";

const mockStatus = {
	status: "WAITING",
	goal: "最高の文書を作る",
	members: [
		{ userId: "user1", name: "Alice", sentence: null },
		{ userId: "user2", name: "Bob", sentence: null },
	],
	distributedWords: [
		"猫",
		"セール",
		"春",
		"新作",
		"入荷",
		"最高",
		"文書",
		"作る",
	],
	pastResults: [
		{
			round: 1,
			goal: "最高の文書を作る",
			results: [
				{ userId: "user1", name: "Alice", sentence: "アバダケダブラ", voteCount: 3 },
				{ userId: "user2", name: "Bob", sentence: "旬の成果がお買い得", voteCount: 5 },
			],
		},
	],
};

setInterval(async () => {
	try {
		if (!localStorage.getItem("passphrase")) {
			console.warn(
				"No passphrase found in localStorage. Skipping room status fetch.",
			);
			return;
		}

		console.log("Fetching room status...");
		window.roomStatus = await API.getRoomStatus();
		window.dispatchEvent(
			new CustomEvent("roomStatusUpdate", { detail: window.roomStatus }),
		);
	} catch (error) {
		// TODO: デバッグようにモックデータを流す。実装後は削除する。
		window.dispatchEvent(
			new CustomEvent("roomStatusUpdate", { detail: mockStatus }),
		);
	}
}, 2000);
