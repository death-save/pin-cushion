import CONSTANTS from "./constants.js";
import API from "./api.js";
import { debug } from "./lib/lib.js";
import { setSocket } from "../pin-cushion.js";

export let pinCushionSocket;
export function registerSocket() {
	debug("Registered pinCushionSocket");
	if (pinCushionSocket) {
		return pinCushionSocket;
	}

	// eslint-disable-next-line no-undef
	pinCushionSocket = socketlib.registerModule(CONSTANTS.MODULE_NAME);

	pinCushionSocket.register("requestEvent", (...args) => API.requestEventArr(...args));
	pinCushionSocket.register("setNoteRevealed", (...args) => API.setNoteRevealedArr(...args));

	setSocket(pinCushionSocket);
	return pinCushionSocket;
}
