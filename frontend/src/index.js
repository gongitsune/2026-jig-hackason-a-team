import { API } from "./api.js";

// HTML要素を取得
const joinForm = document.getElementById("join-form");

// ユーザIDを生成
if (!localStorage.getItem("userId")) {
	const userId = self.crypto.randomUUID();
	localStorage.setItem("userId", userId);
}

// パスフレーズを消す
localStorage.removeItem("passphrase");

// フォームの送信イベントを処理
joinForm.addEventListener("submit", async (event) => {
	event.preventDefault(); // フォームのデフォルトの送信動作を防止

	// フォームデータを取得
	const formData = new FormData(joinForm);
	const name = formData.get("name");
	const passphrase = formData.get("passphrase");

	// パスフレーズをローカルストレージに保存
	localStorage.setItem("passphrase", passphrase);

	// サーバーに参加リクエストを送信
	try {
		await API.postName(name);
	} catch (error) {
		// TODO: UIとして表示してあげたほうが親切かも
		window.alert("参加に失敗しました。時間をおいてもう一度試してください。");
	}
});
