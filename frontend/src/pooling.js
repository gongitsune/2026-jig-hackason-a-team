import { API } from "./api.js";

setInterval(async () => {
	try {
		if (!localStorage.getItem("passphrase")) {
			console.warn(
				"No passphrase found in localStorage. Skipping room status fetch.",
			);
			return;
		}

		console.log("Fetching room status...");
		window.roomStatus = await API.getRoomStatus();
		window.dispatchEvent(
			new CustomEvent("roomStatusUpdate", { detail: window.roomStatus }),
		);
	} catch (error) {
		// TODO: エラーは捨てます
	}
}, 2000);
