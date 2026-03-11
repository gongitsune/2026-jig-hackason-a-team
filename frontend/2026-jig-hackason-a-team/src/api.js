const BACKEND_URL = "https://two026-jig-hackason-a-team.onrender.com";

export const getUserId = () => {
	return localStorage.getItem("userId");
};
const getPassphrase = () => {
	return localStorage.getItem("passphrase");
};

export const checkValidAccess = () => {
	const userId = localStorage.getItem("userId");
	const passphrase = localStorage.getItem("passphrase");
	if (!userId || !passphrase) {
		window.location.href = "./index.html?error=unauthorized";
	}
};

async function handleResponse(response) {
	if (!response.ok) {
		const errorBody = await response.json().catch(() => ({}));
		throw new Error(
			`HTTP ${response.status}: ${errorBody.message || response.statusText}`,
		);
	}
	return response;
}

async function GET(endpoint) {
	const response = await fetch(`${BACKEND_URL}${endpoint}`, {
		method: "GET",
		headers: {
			"X-User-Id": getUserId(),
		},
	});
	return handleResponse(response);
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
	return handleResponse(response);
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
	return handleResponse(response);
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
