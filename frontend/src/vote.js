import { API, getRoomStatus } from "./api.js";

// HTML要素を取得
const voteForm = document.getElementById("vote-form");
const sentenceContainer = document.getElementById("sentence-container");
const goalElement = document.getElementById("target-goal");

// 目標の表示
goalElement.textContent = getRoomStatus().goal;

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

	await API.postVote(chooseUserId);
});

// 全員分の文書を表示
getRoomStatus().members.forEach((member) => {
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
