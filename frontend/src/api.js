const BACKEND_URL = "http://localhost:8000";

let userId = localStorage.getItem("userId");
let passphrase = localStorage.getItem("passphrase");

document.addEventListener("load", () => {
	if (!userId || !passphrase) {
		window.alert("トップページから再度アクセスしてください。");

		// TODO: デバッグ用
		localStorage.setItem("userId", "test-user-id");
		localStorage.setItem("passphrase", "test-passphrase");
		userId = localStorage.getItem("userId");
		passphrase = localStorage.getItem("passphrase");
	}
});

async function GET(endpoint) {
	const response = await fetch(`${BACKEND_URL}${endpoint}`, {
		method: "GET",
		headers: {
			"X-User-Id": userId,
		},
	});
	return response.json();
}

async function POST(endpoint, data) {
	const response = await fetch(`${BACKEND_URL}${endpoint}`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			"X-User-Id": userId,
		},
		body: JSON.stringify(data),
	});
	return response.json();
}

async function PUT(endpoint, data) {
	const response = await fetch(`${BACKEND_URL}${endpoint}`, {
		method: "PUT",
		headers: {
			"Content-Type": "application/json",
			"X-User-Id": userId,
		},
		body: JSON.stringify(data),
	});
	return response.json();
}

// API関数のエクスポート
export const API = {
	// users
	postName: (name) => POST("users", { name }),
	// rooms
	joinRoom: () => POST(`rooms/${passphrase}`, {}),
	startGame: () => PUT(`rooms/${passphrase}`, { status: "WORD_INPUT" }),
	postWords: (word) => POST(`rooms/${passphrase}/words`, { value: word }),
	postSentence: (sentence) =>
		POST(`rooms/${passphrase}/sentences/`, { value: sentence }),
	postVote: (userId) =>
		POST(`rooms/${passphrase}/votes`, { targetUserId: userId }),
	getRoomStatus: () => GET(`rooms/${passphrase}`),
};
