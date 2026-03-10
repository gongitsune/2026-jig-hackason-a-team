import { API } from "./api.js";

const mockStatus = {
	status: "WAITING",
	goal: "最高の文書を作る",
	members: [
		{
			userId: "user1",
			name: "Alice",
			beforeResult: [
				{
					sentence: "アバダケダブラ",
					voteCount: 3,
				},
			],
			sentence: "今回の成果はイマイチ",
		},
		{
			userId: "user2",
			name: "Bob",
			beforeResult: [
				{
					sentence: "旬の成果がお買い得",
					voteCount: 5,
				},
			],
			sentence: "今回の成果はまあまあ",
		},
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
