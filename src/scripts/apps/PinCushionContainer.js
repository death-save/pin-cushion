import { log } from "../lib/lib";
import { PinCushionHUDV2 } from "./PinCushionHUDV2";

/**
 * @class PinCushionContainer
 */
export class PinCushionContainer {
	/**
	 * Handles on the canvasReady Hook.
	 *
	 * Checks all notes, and adds event listeners for
	 * closing the note context menu.
	 *
	 * @static
	 * @memberof PinCushionContainer
	 */
	static onReady() {
		canvas.notes.placeables.forEach(n => this.checkNote(n));

		canvas.mouseInteractionManager.target.on("rightdown", () => canvas.hud.pinCushion.clear());
		canvas.mouseInteractionManager.target.on("mousedown", () => canvas.hud.pinCushion.clear());
        // canvas.mouseInteractionManager.target.on("mouseover", () => canvas.hud.pinCushion.clear());

		log(game.i18n.localize("pinCushion.name") + "| Ready.");
	}

	/**
	 * Handles renderHeadsUpDisplay Hook.
	 *
	 * Creates a new HUD for map notes,
	 * and adds it to the document.
	 *
	 * @static
	 * @param {HeadsUpDisplay} hud - The heads up display container class
	 * @param {jquery} html - The html of the HUD
     * @param {Object} data - The data update of the HUD
	 * @memberof PinCushionContainer
	 */
	static renderHeadsUpDisplay(hud, html, data) {
		hud.pinCushion = new PinCushionHUDV2();
		const hudTemp = document.createElement("template");
		hudTemp.id = "pin-cushion-hud";
		html.append(hudTemp);
	}

	// /**
	//  * Handles the createNote Hook.
	//  *
	//  * @static
	//  * @param {NoteDocument} noteDocument - The document associated with the new note
	//  * @memberof PinCushionContainer
	//  */
	// static createNote(noteDocument) {
	// 	if (noteDocument.object) return this.checkNote(noteDocument.object);
	// }

	// /**
	//  * Handles updateNote Hook.
	//  *
	//  * @static
	//  * @param {NoteDocument} noteDocument - The document associated with the new note
	//  * @memberof PinCushionContainer
	//  */
	// static updateNote(noteDocument) {
	// 	if (noteDocument.object) return this.checkNote(noteDocument.object);
	// }

	/**
	 * Handles the getSceneDirectoryEntryContext Hook.
	 *
	 * Adds a new item to the scene directory context
	 * menu. The new item allows for a new scene note
	 * to be created in one click.
	 *
	 * The new option appears in place of the "Scene Notes"
	 * option in the context menu if the scene doesn't have notes.
	 *
	 * @static
	 * @param {jquery} html - The HTML of the directory tab
	 * @param {object[]} options - An array of objects defining options in the context menu
	 * @memberof PinCushionContainer
	 */
	static getSceneDirEnCtx(html, options) {
		// Add this option at the third index, so that it appears in the same place that
		// the scene notes option would appear
		// options.splice(2, 0, {
		// 	name: "poitp.createNote",
		// 	icon: '<i class="fas fa-scroll"></i>',
		// 	/**
		// 	 * Checks whether or not this option should be shown
		// 	 *
		// 	 * @param {jquery} li - The list item of this option
		// 	 * @return {boolean} True if the scene doesn't have a journal entry defined
		// 	 */
		// 	condition: li => {
		// 		const scene = game.scenes.get(li.data("documentId"));
		// 		return !scene.journal;
		// 	},
		// 	/**
		// 	 * Creates a new Journal Entry for the scene,
		// 	 * with the same name as the scene. Then sets
		// 	 * the new note as the scene notes for that scene.
		// 	 *
		// 	 * @param {jquery} li - The list item of this option
		// 	 */
		// 	callback: li => {
		// 		const scene = game.scenes.get(li.data("documentId"));
		// 		JournalEntry.create({
		// 			name: scene.name,
		// 			type: "base",
		// 			types: "base"
		// 		}, { renderSheet: true })
		// 		.then(entry => scene.update({ "journal": entry.id }));
		// 	}
		// });
	}

	/**
	 * Returns a promise that resolves on the next animation frame.
	 *
	 * @static
	 * @return {Promise} A promise that resolves on the next animation frame
	 * @memberof PinCushionContainer
	 */
	static nextFrame() {
		return new Promise(resolve => window.requestAnimationFrame(resolve));
	}

	/**
	 * Waits for the existence of a property on an object, or some limited number of loops.
	 *
	 * @static
	 * @param {object} object
	 * @param {string} property
	 * @param {number} limit
	 * @memberof PinCushionContainer
	 * @return {Promise<boolean>} A promise that resolves when the property exists, or the limit is reached
	 */
	static async waitFor(object, property, limit) {
		for (; limit > 0 && !object[property]; limit--) await this.nextFrame();
		log(object, object[property]);
		return Boolean(object[property]);
	}

	/**
	 * Checks if the supplied note is associated with a scene,
	 * if so creates a new PinCushionContainer for that note.
	 *
	 * @static
	 * @param {Note} note - A map note to check
	 * @memberof PinCushionContainer
	 */
	static async checkNote(note) {
		// const scene = game.scenes.find(s => s.journal?.id == note?.entry?.id);

		// if (!scene) return;
		if (!await this.waitFor(note, "mouseInteractionManager", 60)) {
            return;
        }
        const scene = canvas.currentScene;
		new PinCushionContainer(note, scene);
	}

	/**
	 * Creates an instance of PinCushionContainer.
	 *
	 * @param {Note} note - A map note
	 * @param {Scene} scene - A source scene
	 * @memberof PinCushionContainer
	 */
	constructor(note, scene) {
		this.note = note;
		this.scene = scene;

		this.activateListeners();
	}
	/**
	 * Activate any event handlers
	 *
	 * @memberof PinCushionContainer
	 */
	activateListeners() {
		log(this.note);
        this.note.mouseInteractionManager.target.on("mousedown", this._leftClick.bind(this));
		this.note.mouseInteractionManager.target.on("rightdown", this._rightClick.bind(this));
        this.note.mouseInteractionManager.target.on("mouseover", this._mouseOver.bind(this));
	}

    /**
	 * Handle the over mouse event
	 *
	 * Binds this note to the context menu HUD
	 * and prevents the event from bubbling
	 *
	 * @param {Event} event - The event that triggered this callback
	 * @memberof PinCushionContainer
	 */
    _mouseOver(event) {
        log(event);
        event.stopPropagation();
        canvas.hud.pinCushion.bind(this);
    }

    /**
	 * Handle the left click event
	 *
	 * Binds this note to the context menu HUD
	 * and prevents the event from bubbling
	 *
	 * @param {Event} event - The event that triggered this callback
	 * @memberof PinCushionContainer
	 */
     _leftClick(event) {
		log(event);
		event.stopPropagation();
		canvas.hud.pinCushion.bind(this);
	}

	/**
	 * Handle the right click event
	 *
	 * Binds this note to the context menu HUD
	 * and prevents the event from bubbling
	 *
	 * @param {Event} event - The event that triggered this callback
	 * @memberof PinCushionContainer
	 */
     _rightClick(event) {
		log(event);
		event.stopPropagation();
		canvas.hud.pinCushion.bind(this);
	}

	/**
	 * Convenience alias for the note x coordniate
	 *
	 * @readonly
	 * @memberof PinCushionContainer
	 */
	get x() { return this.note.x; }
	/**
	* Convenience alias for the note y coordniate
	*
	* @readonly
	* @memberof PinCushionContainer
	*/
	get y() { return this.note.y; }

	/**
	 * @typedef ContextMenuOption
	 * @property {string} icon - A string of HTML representing a Font Awesome icon
	 * @property {string} title - The text, or i18n reference, for the text to display on the option
	 * @property {string} trigger - The name of a method of PinCushionContainer to call in response to clicking this option
	 *//**
	 * Returns an array of menu option for the context menu.
	 *
	 * @return {ContextMenuOption[]}
	 * @memberof PinCushionContainer
	 */
	getOptions() {
        // const options = [
		// 	{
		// 		icon: `<i class="fas fa-eye fa-fw"></i>`,
		// 		title: "poitp.view",
		// 		trigger: "viewScene"
		// 	}
		// ];
		// const gmOptions = game.user.isGM ? [
		// 	{
		// 		icon: `<i class="fas fa-bullseye fa-fw"></i>`,
		// 		title: "poitp.activate",
		// 		trigger: "activateScene"
		// 	},
		// 	{
		// 		icon: `<i class="fas fa-scroll fa-fw"></i>`,
		// 		title: "poitp.toggleNav",
		// 		trigger: "toggleNav"
		// 	}
		// ] : [];
		// return options.concat(gmOptions);
		const options = [];
		return options;
	}

	// /**
	//  * Activates the scene.
	//  *
	//  * @memberof PinCushionContainer
	//  */
	// activateScene() {
	// 	this.scene.activate();
	// }
	// /**
	//  * Shows the scene, but doens't activate it.
	//  *
	//  * @memberof PinCushionContainer
	//  */
	// viewScene() {
	// 	this.scene.view();
	// }
	// /**
	//  * Toggles whether or not the scene is shown in the navigation bar.
	//  *
	//  * @memberof PinCushionContainer
	//  */
	// toggleNav() {
	// 	this.scene.update({ navigation: !this.scene.navigation });
	// }
}
