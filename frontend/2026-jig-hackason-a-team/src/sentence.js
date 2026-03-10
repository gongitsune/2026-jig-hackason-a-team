import { API, addRoomStatusListener, checkValidAccess } from "./api.js";

checkValidAccess();

// 定数
const MAX_CHAR_COUNT = 30;
const MIN_WORD_COUNT = 3;

// HTML要素の取得
const goalElement = document.getElementById("target-goal");

const charCounter = document.getElementById("char-counter");
const sentenceInput = document.getElementById("story-textarea");

const wordSectionTitle = document.getElementById("word-section-title");
const wordContainer = document.getElementById("word-container");

const submitButton = document.getElementById("submit-button");

// ルームステータスを取得
const roomStatus = await API.getRoomStatus();

// ルームステータスを監視
addRoomStatusListener((updatedStatus) => {
	if (updatedStatus.status === "VOTE_INPUT") {
		window.location.href = "./vote.html";
	}
});

// 目標の表示
goalElement.innerText = roomStatus.goal;

// 単語表示
wordSectionTitle.innerText = `単語リスト (${MIN_WORD_COUNT}つ以上含めてください)`;
const wordButtons = roomStatus.distributedWords.map((word) => {
	const wordElement = document.createElement("button");
	wordElement.type = "button";
	wordElement.className = "word-button";
	wordElement.innerText = word;

	// ボタンクリックした時にテキストエリアに単語を追加
	wordElement.addEventListener("click", () => {
		const currentLength = sentenceInput.value.length;
		if (currentLength + word.length <= MAX_CHAR_COUNT) {
			sentenceInput.value += word;
			// 強制的にinputイベントを発火させて、文字数カウンターとボタンの状態を更新
			sentenceInput.dispatchEvent(new Event("input"));
		}
	});

	wordContainer.appendChild(wordElement);

	return wordElement;
});

// テキスト入力まわり
const onInput = () => {
	// 文字内に含まれている単語のボタンを無効化する
	wordButtons.forEach((button) => {
		if (sentenceInput.value.includes(button.innerText)) {
			button.disabled = true;
		} else {
			button.disabled = false;
		}
	});

	// 送信ボタンの有効/無効を切り替える
	const wordCount = roomStatus.distributedWords.filter((word) =>
		sentenceInput.value.includes(word),
	).length;
	submitButton.disabled = wordCount < MIN_WORD_COUNT;
	if (wordCount < MIN_WORD_COUNT) {
		submitButton.innerText = `あと${MIN_WORD_COUNT - wordCount}単語`;
	} else {
		submitButton.innerText = "送信";
	}

	// 文字数カウンターの更新
	const count = sentenceInput.value.length;
	charCounter.innerText = `${count}/${MAX_CHAR_COUNT}`;
};

// テキストエリアの最大文字数を30に設定
sentenceInput.maxLength = MAX_CHAR_COUNT;
onInput();
sentenceInput.addEventListener("input", onInput);

// 送信ボタン
submitButton.addEventListener("click", () => {
	const sentence = sentenceInput.value;
	console.log("送信された文章:", sentence);

	const buttonText = submitButton.innerText;
	submitButton.disabled = true;
	submitButton.innerText = "全員の提出を待っています...";
	API.postSentence(sentence).catch((error) => {
		console.error("Failed to post sentence:", error);
		submitButton.innerText = buttonText;
		submitButton.disabled = false;
	});
});
