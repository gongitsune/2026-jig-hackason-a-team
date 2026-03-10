import { API } from "./api.js";

setInterval(async () => {
	try {
		if (localStorage.getItem("passphrase") === null) {
			console.warn(
				"No passphrase found in localStorage. Skipping room status fetch.",
			);
			return;
		}

		console.log("Fetching room status...");
		window.roomStatus = await API.getRoomStatus();
	} catch (error) {
		// TODO: エラーは捨てます
	}
}, 2000);
