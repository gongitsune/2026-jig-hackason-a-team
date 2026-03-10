import { API, getRoomStatus } from "./api.js";

// HTML要素の取得
const memberListItems = document.getElementById("member-list-items");
const startButton = document.getElementById("start-button");
const targetGoal = document.getElementById("target-goal");
const resultSentences = document.getElementById("result-sentences");

// 目標の表示
targetGoal.textContent = getRoomStatus().goal;

// メンバーリストの表示
getRoomStatus().members.forEach((member) => {
	const listItem = document.createElement("li");
	listItem.classList.add("member-list-item");

	const point = member.beforeResult.reduce(
		(sum, result) => sum + result.voteCount,
		0,
	);
	listItem.innerHTML = `
    <div class="member-name">
      <span class="material-symbols-outlined">account_circle</span>
      ${member.name}
    </div>
    <span class="point"> ${point}pt </span>
  `;

	memberListItems.appendChild(listItem);
});

// 前回投票結果の表示
getRoomStatus().members.forEach((member) => {
	const result = member.beforeResult[0];

	const listItem = document.createElement("li");
	listItem.classList.add("user-info");
	listItem.innerHTML = `
    <div class="user-info">
      <span class="material-symbols-outlined">account_circle</span>
      <span class="user-name">${member.name}</span>
    </div>
    <div class="sentence-vote">
      <span class="sentence-text">${result.sentence}</span>
      <span class="vote-count">${result.voteCount}票</span>
    </div>
  `;

	resultSentences.appendChild(listItem);
});

// スタートボタンの処理
startButton.addEventListener("click", async () => {
	try {
		await API.startGame();
	} catch (error) {
		console.error("ゲームの開始に失敗しました:", error);
		window.alert("ゲームの開始に失敗しました。もう一度試してください。");
	}
});
