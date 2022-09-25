import { PinCushion } from "./module/apps/PinCushion.js";
import CONSTANTS from "./module/constants.js";

/**
 * About this module FormApp
 * @extends FormApplication
 */
export default class PinCushionAboutApp extends FormApplication {
	constructor(options = {}) {
		super(options);
	}

	/**
	 * Call app default options
	 * @override
	 */
	static get defaultOptions() {
		return mergeObject(super.defaultOptions, {
			id: "pin-cushion-about",
			title: `About ${CONSTANTS.MODULE_TITLE}`,
			template: `${CONSTANTS.PATH}/templates/about.hbs`,
			popOut: true,
			width: 500,
			height: 480,
		});
	}

	/**
	 * Supplies data to the template
	 */
	async getData() {
		return {
			moduleName: PinCushion.MODULE_TITLE,
			version: game.modules.get(CONSTANTS.MODULE_NAME).version,
			patrons: await this.fetchPatrons(),
		};
	}

	/**
	 * Fetches a list of Patrons to display on the About page
	 */
	async fetchPatrons() {
		const jsonPath = `${CONSTANTS.PATH}/patrons.json`;
		const response = await fetch(jsonPath);
		if (!response.ok) return null;

		const json = await response.json();
		return json;
	}
}
