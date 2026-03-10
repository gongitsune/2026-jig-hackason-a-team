import { API, addRoomStatusListener } from "./api.js";

const roomStatus = await API.getRoomStatus();

addRoomStatusListener((updatedStatus) => {
	if (updatedStatus.status === "SENTENCE_INPUT") {
		window.location.href = "./sentence.html";
	}
});

const targetText = document.getElementById("target");
targetText.textContent = roomStatus.goal;

const wordForm = document.getElementById("word-form");
const button = document.getElementById("submit-button");

wordForm.addEventListener("submit", (event) => {
	event.preventDefault();

	const formData = new FormData(wordForm);
	const inputWord = formData.get("word-input").trim();

	API.postWords(inputWord);
	button.disabled = true;
	button.textContent = "全員の入力を待っています...";
});
