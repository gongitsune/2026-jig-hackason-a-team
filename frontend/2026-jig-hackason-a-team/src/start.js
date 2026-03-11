import { API, addRoomStatusListener, checkValidAccess, getWinnerImageUrl } from "./api.js";

checkValidAccess();

// HTML要素の取得
const memberListItems = document.getElementById("member-list-items");
const startButton = document.getElementById("start-button");
const targetGoal = document.getElementById("target-goal");
const resultSentences = document.getElementById("result-sentences");
const goBackButton = document.getElementById("back-button");
const beforeResultSection = document.getElementById("before-result");
const errorMessage = document.getElementById("error-message");

const showError = (message) => {
	errorMessage.textContent = message;
	errorMessage.hidden = false;
};

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
	roomStatus.members
		.toSorted((a, b) => pointsByUserId[b.userId] - pointsByUserId[a.userId])
		.forEach((member) => {
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

	// メンバーの数に応じてスタートボタンの表示を切り替え
	const memberCount = roomStatus.members.length;
	startButton.disabled = memberCount < 2;
	if (memberCount < 2) {
		startButton.textContent = "参加者が2人以上必要です";
	} else {
		startButton.textContent = "スタート";
	}

	// 過去ラウンドの投票結果の表示（直近ラウンドを表示、1位が画像を持つ）
	resultSentences.innerHTML = ""; // 一旦リセット
	if (lastRound) {
		const sortedResults = lastRound.results.toSorted(
			(a, b) => b.voteCount - a.voteCount,
		);
		const hasWinnerImage = lastRound.winnerImageAvailable ?? false;
		sortedResults.forEach((result, index) => {
			const isFirst = index === 0;
			const listItem = document.createElement("li");
			listItem.classList.add("result-item");
			if (isFirst) listItem.classList.add("result-item--winner");
			const imageBlock =
				isFirst && hasWinnerImage
					? `<div class="winner-image-wrap">
            <img class="winner-image" src="${getWinnerImageUrl(lastRound.round)}" alt="${result.sentence}のイメージ" loading="lazy" />
          </div>`
					: "";
			listItem.innerHTML = `
      <div class="user-info">
        <span class="material-symbols-outlined">account_circle</span>
        <span class="user-name">${result.name}</span>
      </div>
      <div class="sentence-vote">
        <span class="sentence-text">${result.sentence}</span>
        <span class="vote-count">${result.voteCount}票</span>
      </div>
      ${imageBlock}
    `;

			resultSentences.appendChild(listItem);
		});
	}

	// ステータスを見て次の画面に遷移
	if (roomStatus.status === "WORD_INPUT") {
		window.location.href = "./word.html";
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
		showError("ゲームの開始に失敗しました。もう一度試してください。");
	}
});

//index.htmlに戻す処理
goBackButton.addEventListener("click", async () => {
	location.href = "./index.html";
});
