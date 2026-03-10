import {
	API,
	addRoomStatusListener,
	checkValidAccess,
	getUserId,
} from "./api.js";

checkValidAccess();

// HTML要素を取得
const voteForm = document.getElementById("vote-form");
const sentenceContainer = document.getElementById("sentence-container");
const goalElement = document.getElementById("target-goal");
const submitButton = document.getElementById("submit-button");

// ルームステータスを取得
const roomStatus = await API.getRoomStatus();

// ルームステータスを監視
addRoomStatusListener((updatedStatus) => {
	if (updatedStatus.status === "WAITING") {
		window.location.href = "./start.html";
	}
});

// 目標の表示
goalElement.textContent = roomStatus.goal;

// フォームの送信イベントを処理
voteForm.addEventListener("submit", async (event) => {
	event.preventDefault(); // フォームのデフォルトの送信動作を防止

	// フォームデータを取得
	const formData = new FormData(voteForm);
	const chooseUserId = formData.get("sentence-list");

	if (!chooseUserId) {
		window.alert("投票する文書を選択してください。");
		return;
	}

	submitButton.disabled = true;
	submitButton.textContent = "全員の投票を待っています...";

	await API.postVote(chooseUserId);
});

// 全員分の文書を表示
roomStatus.members
	.filter((member) => member.userId !== getUserId())
	.forEach((member) => {
		const sentence = member.sentence;

		const input = document.createElement("input");
		input.type = "radio";
		input.name = "sentence-list";
		input.required = true;
		input.value = member.userId;

		const span = document.createElement("span");
		span.classList.add("card-text");
		span.textContent = sentence;

		const label = document.createElement("label");
		label.classList.add("card");
		label.appendChild(input);
		label.appendChild(span);

		sentenceContainer.appendChild(label);
	});
