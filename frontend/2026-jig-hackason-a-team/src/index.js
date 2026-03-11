import { API, addRoomStatusListener } from "./api.js";

// HTML要素を取得
const joinForm = document.getElementById("join-form");
const joinButton = document.getElementById("join-button");
const passphraseInput = document.getElementById("room-id-input");
const errorMessage = document.getElementById("error-message");

const showError = (message) => {
	errorMessage.textContent = message;
	errorMessage.hidden = false;
};

const clearError = () => {
	errorMessage.hidden = true;
};

// ユーザIDを生成
if (!localStorage.getItem("userId")) {
	const userId = self.crypto.randomUUID();
	localStorage.setItem("userId", userId);
}

// パスフレーズを消す
localStorage.removeItem("passphrase");

// checkValidAccess() からリダイレクトされた場合のエラー表示
const urlParams = new URLSearchParams(window.location.search);
if (urlParams.get("error") === "unauthorized") {
	showError("トップページからアクセスしてください。");
}

// フォームの送信イベントを処理
joinForm.addEventListener("submit", async (event) => {
	event.preventDefault(); // フォームのデフォルトの送信動作を防止

	// フォームデータを取得
	const formData = new FormData(joinForm);
	const name = formData.get("username");
	const passphrase = formData.get("passphrase");

	// パスフレーズをローカルストレージに保存
	localStorage.setItem("passphrase", passphrase);

	// サーバーに参加リクエストを送信
	try {
		clearError();
		await API.joinRoom(name);

		// 参加成功後、ゲーム画面に遷移
		window.location.href = "./start.html";
	} catch (error) {
		console.error("Failed to join room:", error);
		showError("参加に失敗しました。時間をおいてもう一度試してください。");
	}
});

passphraseInput.addEventListener("input", () => {
	localStorage.setItem("passphrase", passphraseInput.value);
	if (!passphraseInput.value) {
		joinButton.disabled = true;
	}
});

// 参加ボタンの有効無効を切り替え
joinButton.disabled = true; // 初期状態では無効
addRoomStatusListener((roomStatus) => {
	const isGameStarted = roomStatus.status === "WAITING";
	joinButton.disabled = !isGameStarted;
});
