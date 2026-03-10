import { API } from "./api";

// HTML要素を取得
const voteForm = document.getElementById("vote-form");
const sentenceContainer = document.getElementById("sentence-container");

// フォームの送信イベントを処理
voteForm.addEventListener("submit", async (event) => {
	event.preventDefault(); // フォームのデフォルトの送信動作を防止

	// フォームデータを取得
	const formData = new FormData(voteForm);
	const choose = formData.get("sentence-list");

	// TODO: APIに投票データを送信
	console.log("投票データ:", choose);
});

// 全員分の文書を表示
// TODO: APIから文書データを取得して表示するように変更
const sentences = [
	"アバダケダブラ",
	"旬の成果がお買い得",
	"春の新作が続々入荷",
];

sentences.forEach((sentence) => {
	const input = document.createElement("input");
	input.type = "radio";
	input.name = "sentence-list";
	input.value = sentence;

	const span = document.createElement("span");
	span.classList.add("card-text");
	span.textContent = sentence;

	const label = document.createElement("label");
	label.classList.add("card");
	label.appendChild(input);
	label.appendChild(span);

	sentenceContainer.appendChild(label);
});
