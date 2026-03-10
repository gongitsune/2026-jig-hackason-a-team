const BACKEND_URL = "https://two026-jig-hackason-a-team.onrender.com";

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
export const addRoomStatusListener = (listener) => {
	window.addEventListener("roomStatusUpdate", (e) => listener(e.detail));
};
