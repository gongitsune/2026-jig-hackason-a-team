const http = require("http");

const PORT = 1234;

// インメモリデータ
const rooms = {};
// 構造例:
// {
//   "passphrase123": {
//     status: "WAITING",
//     round: 1,
//     members: ["user-id-1"],
//     distributedWords: ["猫", "春", "新作"]
//   }
// }

const users = {};
// 構造例:
// {
//   "user-id-1": { name: "Alice", roomPassphrase: "passphrase123" }
// }

const words = []; // { roomPassphrase, userId, round, value }
const sentences = []; // { id, roomPassphrase, userId, round, value }
const votes = []; // { roomPassphrase, userId, sentenceId }

const server = http.createServer((req, res) => {
	// CORS ヘッダーの設定
	res.setHeader("Access-Control-Allow-Origin", "*");
	res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, OPTIONS");
	res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-User-Id");

	if (req.method === "OPTIONS") {
		res.writeHead(204);
		res.end();
		return;
	}

	const url = new URL(req.url, `http://${req.headers.host}`);
	const userId = req.headers["x-user-id"];

	let body = "";
	req.on("data", (chunk) => {
		body += chunk.toString();
	});

	req.on("end", () => {
		const payload = body ? JSON.parse(body) : {};

		// ルーティング
		if (req.method === "POST" && url.pathname === "/users") {
			// POST /users
			const newUserId =
				userId || `user-${Math.random().toString(36).substr(2, 9)}`;
			users[newUserId] = { name: payload.name, id: newUserId };
			res.writeHead(200, { "Content-Type": "application/json" });
			res.end(JSON.stringify(users[newUserId]));
			return;
		}

		const roomMatch = url.pathname.match(/^\/rooms\/([^/]+)$/);
		if (roomMatch) {
			const passphrase = roomMatch[1];
			if (req.method === "POST") {
				// POST /rooms/:passphrase (Join Room)
				if (!rooms[passphrase]) {
					rooms[passphrase] = {
						status: "WAITING",
						round: 1,
						members: [],
						distributedWords: ["猫", "春", "新作", "最高", "文書", "作る"],
					};
				}
				if (userId && !rooms[passphrase].members.includes(userId)) {
					rooms[passphrase].members.push(userId);
					if (users[userId]) users[userId].roomPassphrase = passphrase;
				}
				res.writeHead(200, { "Content-Type": "application/json" });
				res.end(JSON.stringify(rooms[passphrase]));
				return;
			}

			if (req.method === "PUT") {
				// PUT /rooms/:passphrase (Start Game / Update Status)
				if (rooms[passphrase]) {
					rooms[passphrase].status = payload.status;
				}
				res.writeHead(200, { "Content-Type": "application/json" });
				res.end(JSON.stringify(rooms[passphrase] || {}));
				return;
			}

			if (req.method === "GET") {
				// GET /rooms/:passphrase (Get Room Status)
				const room = rooms[passphrase] || {
					status: "WAITING",
					members: [],
					distributedWords: [],
				};
				const roomMembers = (room.members || []).map((id) => {
					const user = users[id] || { name: "Unknown" };
					const userSentence = sentences.find(
						(s) =>
							s.roomPassphrase === passphrase &&
							s.userId === id &&
							s.round === room.round,
					);

					return {
						userId: id,
						name: user.name,
						sentence: userSentence ? userSentence.value : null,
					};
				});

				// 過去ラウンドの結果を構築
				const currentRound = room.round || 1;
				const roomSentences = sentences.filter((s) => s.roomPassphrase === passphrase);
				const pastRoundNumbers =
					currentRound > 1
						? Array.from({ length: currentRound - 1 }, (_, i) => i + 1)
						: [...new Set(roomSentences.map((s) => s.round))].sort((a, b) => a - b);
				const pastResults = pastRoundNumbers.map((round) => {
					const roundSentences = sentences.filter(
						(s) => s.roomPassphrase === passphrase && s.round === round,
					);
					const results = roundSentences.map((s) => {
						const voteCount = votes.filter((v) => v.sentenceId === s.id).length;
						const user = users[s.userId] || { name: "Unknown" };
						return {
							userId: s.userId,
							name: user.name,
							sentence: s.value,
							voteCount,
						};
					});
					// モックでは room の goal を各ラウンドに使用
					const goal = room.goal || "最高の文書を作る";
					return { round, goal, results };
				});

				res.writeHead(200, { "Content-Type": "application/json" });
				res.end(
					JSON.stringify({
						status: room.status,
						goal: "最高の文書を作る",
						members: roomMembers,
						distributedWords: room.distributedWords || [],
						pastResults,
					}),
				);
				return;
			}
		}

		const wordMatch = url.pathname.match(/^\/rooms\/([^/]+)\/words$/);
		if (wordMatch && req.method === "POST") {
			const passphrase = wordMatch[1];
			words.push({
				roomPassphrase: passphrase,
				userId,
				round: rooms[passphrase]?.round || 1,
				value: payload.value,
			});
			res.writeHead(200, { "Content-Type": "application/json" });
			res.end(JSON.stringify({ status: "ok" }));
			return;
		}

		const sentenceMatch = url.pathname.match(/^\/rooms\/([^/]+)\/sentences\/$/);
		if (sentenceMatch && req.method === "POST") {
			const passphrase = sentenceMatch[1];
			const id = sentences.length + 1;
			sentences.push({
				id,
				roomPassphrase: passphrase,
				userId,
				round: rooms[passphrase]?.round || 1,
				value: payload.value,
			});
			res.writeHead(200, { "Content-Type": "application/json" });
			res.end(JSON.stringify({ status: "ok", id }));
			return;
		}

		const voteMatch = url.pathname.match(/^\/rooms\/([^/]+)\/votes$/);
		if (voteMatch && req.method === "POST") {
			const passphrase = voteMatch[1];
			// payload.targetUserId に投票
			const targetSentence = sentences.find(
				(s) =>
					s.roomPassphrase === passphrase &&
					s.userId === payload.targetUserId &&
					s.round === rooms[passphrase]?.round,
			);
			if (targetSentence) {
				votes.push({
					roomPassphrase: passphrase,
					userId,
					sentenceId: targetSentence.id,
				});
			}
			res.writeHead(200, { "Content-Type": "application/json" });
			res.end(JSON.stringify({ status: "ok" }));
			return;
		}

		// 404
		res.writeHead(404);
		res.end();
	});
});

server.listen(PORT, () => {
	console.log(`Mock server is running at http://localhost:${PORT}`);
});
