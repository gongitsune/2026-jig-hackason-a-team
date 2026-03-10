const BACKEND_URL = "http://localhost:8080";

export const getUserId = () => {
	const value = localStorage.getItem("userId");
	if (!value) {
		window.alert("トップページからアクセスしてください。");
		// TODO: テスト用のユーザIDを生成して保存する。実装後は削除する。
		localStorage.setItem("userId", "test-user-id");
	}
	return value;
};
const getPassphrase = () => {
	const value = localStorage.getItem("passphrase");
	if (!value) {
		window.alert("トップページからアクセスしてください。");
		// TODO: テスト用のパスフレーズを生成して保存する。実装後は削除する。
		localStorage.setItem("passphrase", "test-passphrase");
	}
	return value;
};

async function GET(endpoint) {
	const response = await fetch(`${BACKEND_URL}${endpoint}`, {
		method: "GET",
		headers: {
			"X-User-Id": getUserId(),
		},
	});
	return response;
}

async function POST(endpoint, data) {
	const response = await fetch(`${BACKEND_URL}${endpoint}`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			"X-User-Id": getUserId(),
		},
		body: JSON.stringify(data),
	});
	return response;
}

async function PUT(endpoint, data) {
	const response = await fetch(`${BACKEND_URL}${endpoint}`, {
		method: "PUT",
		headers: {
			"Content-Type": "application/json",
			"X-User-Id": getUserId(),
		},
		body: JSON.stringify(data),
	});
	return response;
}

// API関数のエクスポート
export const API = {
	// rooms
	joinRoom: (userName) => POST(`/rooms/${getPassphrase()}`, { userName }),
	startGame: () => PUT(`/rooms/${getPassphrase()}`, { status: "WORD_INPUT" }),
	postWords: (word) => POST(`/rooms/${getPassphrase()}/words`, { value: word }),
	postSentence: (sentence) =>
		POST(`/rooms/${getPassphrase()}/sentences`, { value: sentence }),
	postVote: (userId) =>
		POST(`/rooms/${getPassphrase()}/votes`, { targetUserId: userId }),
	getRoomStatus: () =>
		GET(`/rooms/${getPassphrase()}`).then((res) => res.json()),
};

// ルームステータス
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

export const getRoomStatus = () => window.roomStatus || mockStatus;
export const addRoomStatusListener = (listener) => {
	window.addEventListener("roomStatusUpdate", (e) => listener(e.detail));
};
