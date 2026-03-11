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
const errorMessage = document.getElementById("error-message");

const showError = (message) => {
	errorMessage.textContent = message;
	errorMessage.hidden = false;
};

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

// 全員分の文書を表示
const radioButtons = roomStatus.members
	.filter((member) => member.userId !== getUserId())
	.map((member) => {
		const sentence = member.sentence;

		const input = document.createElement("input");
		input.type = "radio";
		input.name = "sentence-list";
		input.required = true;
		input.value = member.userId;

		const span = document.createElement("span");
		span.classList.add("card-text");
		span.innerHTML = roomStatus.distributedWords.reduce((acc, word) => {
			console.log("word:", acc);
			return acc.replaceAll(word, `<span class="highlight">${word}</span>`);
		}, sentence);

		const label = document.createElement("label");
		label.classList.add("card");
		label.appendChild(input);
		label.appendChild(span);

		sentenceContainer.appendChild(label);
		return input;
	});

// フォームの送信イベントを処理
voteForm.addEventListener("submit", async (event) => {
	event.preventDefault(); // フォームのデフォルトの送信動作を防止

	// フォームデータを取得
	const formData = new FormData(voteForm);
	const chooseUserId = formData.get("sentence-list");

	if (!chooseUserId) {
		showError("投票する文書を選択してください。");
		return;
	}

	radioButtons.forEach((button) => {
		button.disabled = true;
	});

	submitButton.disabled = true;
	submitButton.textContent = "全員の投票を待っています...";

	await API.postVote(chooseUserId);
});
