import { API, addRoomStatusListener } from "./api.js";

// HTML要素の取得
const memberListItems = document.getElementById("member-list-items");
const startButton = document.getElementById("start-button");
const targetGoal = document.getElementById("target-goal");
const resultSentences = document.getElementById("result-sentences");
const goBackButton = document.getElementById("back-button");
const beforeResultSection = document.getElementById("before-result");

const updateContents = (roomStatus) => {
	// 目標の表示（直近の pastResults があればその goal、なければ room の goal）
	const pastResults = roomStatus.pastResults || [];
	const lastRound = pastResults[pastResults.length - 1];

	// 過去結果がないときはセクションを非表示
	beforeResultSection.hidden = !lastRound;
	targetGoal.textContent = lastRound?.goal || roomStatus.goal || "";

	// pastResults から各メンバーの合計得点を計算
	const pointsByUserId = {};
	roomStatus.members.forEach((m) => {
		pointsByUserId[m.userId] = 0;
	});
	pastResults.forEach((pastRound) => {
		pastRound.results.forEach((r) => {
			if (pointsByUserId[r.userId] !== undefined) {
				pointsByUserId[r.userId] += r.voteCount;
			}
		});
	});

	// メンバーリストの更新
	memberListItems.innerHTML = ""; // 一旦リセット
	roomStatus.members.forEach((member) => {
		const listItem = document.createElement("li");
		listItem.classList.add("member-list-item");
		const point = pointsByUserId[member.userId] ?? 0;
		listItem.innerHTML = `
    <div class="member-name">
      <span class="material-symbols-outlined">account_circle</span>
      ${member.name}
    </div>
    <span class="point"> ${point}pt </span>
  `;

		memberListItems.appendChild(listItem);
	});

	// 過去ラウンドの投票結果の表示（直近ラウンドを表示）
	resultSentences.innerHTML = ""; // 一旦リセット
	if (lastRound) {
		lastRound.results.forEach((result) => {
			const listItem = document.createElement("li");
			listItem.classList.add("user-info");
			listItem.innerHTML = `
      <div class="user-info">
        <span class="material-symbols-outlined">account_circle</span>
        <span class="user-name">${result.name}</span>
      </div>
      <div class="sentence-vote">
        <span class="sentence-text">${result.sentence}</span>
        <span class="vote-count">${result.voteCount}票</span>
      </div>
    `;

			resultSentences.appendChild(listItem);
		});
	}

	// ステータスを見て次の画面に遷移
	if (roomStatus.status === "WORD_INPUT") {
		window.location.href = "/word.html";
	}
};

updateContents(await API.getRoomStatus());
addRoomStatusListener(updateContents);

// スタートボタンの処理
startButton.addEventListener("click", async () => {
	try {
		await API.startGame();

		startButton.disabled = true;
		startButton.textContent = "全員のスタートを待っています...";
	} catch (error) {
		console.error("ゲームの開始に失敗しました:", error);
		window.alert("ゲームの開始に失敗しました。もう一度試してください。");
	}
});

//index.htmlに戻す処理
goBackButton.addEventListener("click", async () => {
	location.href="/index.html";
});


