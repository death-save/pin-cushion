import { PinCushion } from "./apps/PinCushion.js";
import { error, warn } from "./lib/lib.js";

const API = {
	pinCushion: new PinCushion(),
	/**
	 * Request an action to be executed with GM privileges.
	 *
	 * @static
	 * @param {object} message - The object that will get emitted via socket
	 * @param {string} message.action - The specific action to execute
	 * @returns {Promise} The promise of the action which will be resolved after execution by the GM
	 */
	async requestEventArr(...inAttributes) {
		if (!Array.isArray(inAttributes)) {
			throw error("requestEventArr | inAttributes must be of type array");
		}
		const [message] = inAttributes; // e.g. { action: "createFolder" }
		// A request has to define what action should be executed by the GM
		// if (!'action' in message) {
		//   return;
		// }
		if (!Object.keys(message)?.includes("action")) {
			warn(`Message doesn't contain the 'action'`);
			return;
		}
		const id = `${game.user.id}_${Date.now()}_${randomID()}`;
		message.id = id;
		// let baseFolder = (
		//   game.folders?.contents.filter(
		//     (x) => x.type == 'Journal' && f.name?.toLowerCase() == game.user.name.toLowerCase(),
		//   )[0]
		// );
		let baseFolder = game.journal.directory.folders.find(
			(f) => f.name?.toLowerCase() === game.user.name?.toLowerCase()
		);
		if (!baseFolder) {
			baseFolder = await Folder.create({
				id: message.id,
				name: game.user.name,
				type: "Journal",
				parent: null,
			});
		}
		return baseFolder;
	},

	async setNoteRevealedArr(...inAttributes) {
		if (!Array.isArray(inAttributes)) {
			throw error("requestEventArr | inAttributes must be of type array");
		}
		const [notedata, visible] = inAttributes; // e.g. { action: "createFolder" }
		this.setNoteRevealed(notedata, visible);
	},

	async setNoteRevealed(notedata, visible) {
		PinCushion.setNoteRevealed(notedata, visible);
	},
};
export default API;
