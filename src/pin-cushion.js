/* ------------------------------------ */
/* Other Hooks							*/
/* ------------------------------------ */

import API from "./module/api.js";
import CONSTANTS from "./module/constants.js";
import { log, debug, is_real_number, stripQueryStringAndHashFromPath, error } from "./module/lib/lib.js";
import { registerSettings } from "./module/settings.js";
import { pinCushionSocket, registerSocket } from "./module/socket.js";
import { PinCushionHUD } from "./module/apps/PinCushionHUD.js";
import { PinCushion } from "./module/apps/PinCushion.js";

/**
 * Initialization helper, to set API.
 * @param api to set to game module.
 */
export function setApi(api) {
	const data = game.modules.get(CONSTANTS.MODULE_NAME);
	data.api = api;
}
/**
 * Returns the set API.
 * @returns Api from games module.
 */
export function getApi() {
	const data = game.modules.get(CONSTANTS.MODULE_NAME);
	return data.api;
}
/**
 * Initialization helper, to set Socket.
 * @param socket to set to game module.
 */
export function setSocket(socket) {
	const data = game.modules.get(CONSTANTS.MODULE_NAME);
	data.socket = socket;
}
/*
 * Returns the set socket.
 * @returns Socket from games module.
 */
export function getSocket() {
	const data = game.modules.get(CONSTANTS.MODULE_NAME);
	return data.socket;
}

/* -------------------------------------------------------------------------- */
/*                                    Hooks                                   */
/* -------------------------------------------------------------------------- */

/* ------------------------------------ */
/* Initialize module					*/
/* ------------------------------------ */
Hooks.once("init", function () {
	log(" init " + CONSTANTS.MODULE_NAME);

	globalThis.PinCushion = PinCushion;
	// globalThis.setNoteRevealed = setNoteRevealed; // Seem not necessary
	// globalThis.setNoteGMtext = setNoteGMtext // Seem not necessary
	registerSettings();

	Hooks.once("socketlib.ready", registerSocket);

	// eslint-disable-next-line no-undef
	libWrapper.register(
		PinCushion.MODULE_NAME,
		"NotesLayer.prototype._onClickLeft2",
		PinCushion._onDoubleClick,
		"OVERRIDE"
	);

	const enablePlayerIconAutoOverride = game.settings.get(PinCushion.MODULE_NAME, "playerIconAutoOverride");
	if (enablePlayerIconAutoOverride) {
		// eslint-disable-next-line no-undef
		libWrapper.register(
			PinCushion.MODULE_NAME,
			"NoteDocument.prototype.prepareData",
			PinCushion._onPrepareNoteData,
			"WRAPPER"
		);
	}
});

/* ------------------------------------ */
/* Setup module							*/
/* ------------------------------------ */
Hooks.once("setup", function () {
	setApi(API);

	const forceToShowNotes = game.settings.get(PinCushion.MODULE_NAME, "forceToShowNotes");
	if (forceToShowNotes) {
		// Automatically flag journal notes to show on the map without having to have your players turn it on themselves.
		game.settings.set("core", "notesDisplayToggle", true);
	}
});

/* ------------------------------------ */
/* When ready							*/
/* ------------------------------------ */

Hooks.once("ready", function () {
	if (!game.modules.get("lib-wrapper")?.active && game.user?.isGM) {
		let word = "install and activate";
		if (game.modules.get("lib-wrapper")) word = "activate";
		throw error(`Requires the 'libWrapper' module. Please ${word} it.`);
	}
	if (!game.modules.get("socketlib")?.active && game.user?.isGM) {
		let word = "install and activate";
		if (game.modules.get("socketlib")) word = "activate";
		throw error(`Requires the 'socketlib' module. Please ${word} it.`);
	}
	// Instantiate PinCushion instance for central socket request handling
	game.pinCushion = new PinCushion();
	// Wait for game to exist, then register socket handler
	// game.socket.on(`module.${PinCushion.MODULE_NAME}`, game.pinCushion._onSocket);
});

/**
 * Hook on note config render to inject filepicker and remove selector
 * Update Note config window with a text box to allow entry of GM-text.
 * Also replace single-line of "Text Label" with a textarea to allow multi-line text.
 * @param {NoteConfig} app    The Application instance being rendered (NoteConfig)
 * @param {jQuery} html       The inner HTML of the document that will be displayed and may be modified
 * @param {object] data       The object of data used when rendering the application (from NoteConfig#getData)
 */
Hooks.on("renderNoteConfig", async (app, html, noteData) => {
	if (!app.object.document.flags[PinCushion.MODULE_NAME]) {
		app.object.document.flags[PinCushion.MODULE_NAME] = {};
	}
	// TODO THIS CODE CAN B DONE MUCH BETTER...
	const showJournalImageByDefault = game.settings.get(PinCushion.MODULE_NAME, "showJournalImageByDefault");
	// const showImageExplicitSource = stripQueryStringAndHashFromPath(
	//   app.object.getFlag(PinCushion.MODULE_NAME, PinCushion.FLAGS.SHOW_IMAGE_EXPLICIT_SOURCE) ?? noteData.document.texture.src,
	// );
	// const iconPinCushion = stripQueryStringAndHashFromPath(
	//   app.object.getFlag(PinCushion.MODULE_NAME, PinCushion.FLAGS.CUSHION_ICON) ?? noteData.document.texture.src,
	// );

	if (
		showJournalImageByDefault &&
		noteData.document.entryId &&
		!app.object.getFlag(PinCushion.MODULE_NAME, PinCushion.FLAGS.CUSHION_ICON)
	) {
		// Journal id
		const journal = game.journal.get(noteData.document.entryId);
		const journalEntryImage = retrieveFirstImageFromJournalId(j.id);
		if (journalEntryImage) {
			setProperty(noteData.document.texture, "src", stripQueryStringAndHashFromPath(journalEntryImage));
		}
	}
	let tmp = stripQueryStringAndHashFromPath(app.object.document.texture.src ?? noteData.document.texture.src);
	// TODO find a better method
	if (app.object.document.texture.src === "icons/svg/book.svg" && noteData.document.texture.src) {
		tmp = stripQueryStringAndHashFromPath(noteData.document.texture.src);
	}
	if (app.object.getFlag(PinCushion.MODULE_NAME, PinCushion.FLAGS.CUSHION_ICON)) {
		setProperty(
			noteData.document.texture,
			"src",
			stripQueryStringAndHashFromPath(app.object.getFlag(PinCushion.MODULE_NAME, PinCushion.FLAGS.CUSHION_ICON))
		);
		tmp = stripQueryStringAndHashFromPath(
			app.object.getFlag(PinCushion.MODULE_NAME, PinCushion.FLAGS.CUSHION_ICON)
		);
	}
	PinCushion._replaceIconSelector(app, html, noteData, tmp);
	//Causes a bug when attempting to place an journal entry onto the canvas in Foundry 9.
	//await app.object.setFlag(PinCushion.MODULE_NAME, PinCushion.FLAGS.CUSHION_ICON, tmp);
	setProperty(app.object.document.flags[PinCushion.MODULE_NAME], PinCushion.FLAGS.CUSHION_ICON, tmp);

	PinCushion._addShowImageField(app, html, noteData);
	PinCushion._addPinIsTransparentField(app, html, noteData);
	PinCushion._addShowOnlyToGMField(app, html, noteData);

	// const enableBackgroundlessPins = game.settings.get(PinCushion.MODULE_NAME, 'enableBackgroundlessPins');
	// if (enableBackgroundlessPins) {
	PinCushion._addBackgroundField(app, html, noteData);
	// }

	const enablePlayerIcon = game.settings.get(PinCushion.MODULE_NAME, "playerIconAutoOverride");
	if (enablePlayerIcon) {
		PinCushion._addPlayerIconField(app, html, noteData);
	}

	const enableNoteGM = game.settings.get(PinCushion.MODULE_NAME, "noteGM");
	if (enableNoteGM) {
		PinCushion._addNoteGM(app, html, noteData);
	}

	const enableNoteTintColorLink = game.settings.get(PinCushion.MODULE_NAME, "revealedNotes");
	if (enableNoteTintColorLink) {
		PinCushion._addNoteTintColorLink(app, html, noteData);
	}

	PinCushion._addHideLabel(app, html, noteData);
	PinCushion._addPreviewAsTextSnippet(app, html, noteData);
	PinCushion._addDoNotShowJournalPreview(app, html, noteData);
	//PinCushion._addAboveFog(app, html, data);
	PinCushion._addTooltipHandler(app, html, noteData);

	// Force a recalculation of the height
	if (!app._minimized) {
		let pos = app.position;
		pos.height = "auto";
		app.setPosition(pos);
	}
});

/**
 * Hook on render HUD
 */
Hooks.on("renderHeadsUpDisplay", (app, html, data) => {
	// const showPreview = game.settings.get(PinCushion.MODULE_NAME, 'showJournalPreview');
	// if (showPreview) {
	html.append(`<template id="pin-cushion-hud"></template>`);
	canvas.hud.pinCushion = new PinCushionHUD();
	// }
});

/**
 * Hook on Note hover
 */
Hooks.on("hoverNote", (note, hovered) => {
	// const showPreview = game.settings.get(PinCushion.MODULE_NAME, 'showJournalPreview');
	const previewDelay = game.settings.get(PinCushion.MODULE_NAME, "previewDelay");
	let doNotShowJournalPreviewS = String(
		getProperty(note, `document.flags.${PinCushion.MODULE_NAME}.${PinCushion.FLAGS.DO_NOT_SHOW_JOURNAL_PREVIEW}`)
	);
	if (doNotShowJournalPreviewS !== "true" && doNotShowJournalPreviewS !== "false") {
		doNotShowJournalPreviewS = "true";
	}
	const doNotShowJournalPreview = String(doNotShowJournalPreviewS) === "true" ? true : false;
	let tooltipForceRemoveS = String(
		getProperty(note, `document.flags.${PinCushion.MODULE_NAME}.${PinCushion.FLAGS.TOOLTIP_FORCE_REMOVE}`)
	);
	if (tooltipForceRemoveS !== "true" && tooltipForceRemoveS !== "false") {
		tooltipForceRemoveS = "false";
	}
	const tooltipForceRemove = String(tooltipForceRemoveS) === "true" ? true : false;

	if (doNotShowJournalPreview) {
		return;
	}

	if (!hovered) {
		clearTimeout(game.pinCushion.hoverTimer);
		if (tooltipForceRemove) {
			$("#powerTip").remove();
		}
		return canvas.hud.pinCushion.clear();
	}

	// If the note is hovered by the mouse cursor (not via alt/option)
	if (hovered && note.mouseInteractionManager.state === 1) {
		game.pinCushion.hoverTimer = setTimeout(function () {
			canvas.hud.pinCushion.bind(note);
		}, previewDelay);
		return;
	} else {
		// THis code should be never reached
		if (!hovered) {
			clearTimeout(game.pinCushion.hoverTimer);
			return canvas.hud.pinCushion.clear();
		}
	}
});

/**
 * Hook on render Journal Directory
 */
Hooks.on("renderJournalDirectory", (app, html, data) => {
	PinCushion._addJournalThumbnail(app, html, data);
});

Hooks.on("renderJournalSheet", (app, html, data) => {
	PinCushion._renderJournalThumbnail(app, html);
});

Hooks.once("canvasInit", () => {
	// This module is only required for GMs (game.user accessible from 'ready' event but not 'init' event)
	if (game.user.isGM && game.settings.get(PinCushion.MODULE_NAME, "noteGM")) {
		// eslint-disable-next-line no-undef
		libWrapper.register(
			PinCushion.MODULE_NAME,
			"Note.prototype._drawTooltip",
			PinCushion._addDrawTooltipWithNoteGM,
			"WRAPPER"
		);
	} else {
		// eslint-disable-next-line no-undef
		libWrapper.register(
			PinCushion.MODULE_NAME,
			"Note.prototype._drawTooltip",
			PinCushion._addDrawTooltip2,
			"MIXED"
		);
	}

	// eslint-disable-next-line no-undef
	libWrapper.register(PinCushion.MODULE_NAME, "Note.prototype.refresh", PinCushion._noteRefresh, "WRAPPER");

	// eslint-disable-next-line no-undef
	libWrapper.register(PinCushion.MODULE_NAME, "Note.prototype.isVisible", PinCushion._isVisible, "MIXED");

	// eslint-disable-next-line no-undef
	libWrapper.register(
		PinCushion.MODULE_NAME,
		"Note.prototype._drawControlIcon",
		PinCushion._drawControlIcon,
		"OVERRIDE"
	);

	const enableOneClickNoteCreation = game.settings.get(PinCushion.MODULE_NAME, "oneClickNoteCreation");
	if (enableOneClickNoteCreation) {
		// This module is only required for GMs (game.user accessible from 'ready' event but not 'init' event)
		if (game.user.isGM) {
			// eslint-disable-next-line no-undef
			libWrapper.register(
				PinCushion.MODULE_NAME,
				"NotesLayer.prototype._onClickLeft",
				PinCushion._onSingleClick,
				"OVERRIDE"
			);
		}
	}
});

Hooks.on("renderSettingsConfig", (app, html, data) => {
	// Add colour pickers to the Configure Game Settings: Module Settings menu
	let name, colour;
	name = `${PinCushion.MODULE_NAME}.revealedNotesTintColorLink`;
	colour = game.settings.get(PinCushion.MODULE_NAME, "revealedNotesTintColorLink");
	$("<input>")
		.attr("type", "color")
		.attr("data-edit", name)
		.val(colour)
		.insertAfter($(`input[name="${name}"]`, html).addClass("color"));

	name = `${PinCushion.MODULE_NAME}.revealedNotesTintColorNotLink`;
	colour = game.settings.get(PinCushion.MODULE_NAME, "revealedNotesTintColorNotLink");
	$("<input>")
		.attr("type", "color")
		.attr("data-edit", name)
		.val(colour)
		.insertAfter($(`input[name="${name}"]`, html).addClass("color"));

	name = `${PinCushion.MODULE_NAME}.revealedNotesTintColorRevealed`;
	colour = game.settings.get(PinCushion.MODULE_NAME, "revealedNotesTintColorRevealed");
	$("<input>")
		.attr("type", "color")
		.attr("data-edit", name)
		.val(colour)
		.insertAfter($(`input[name="${name}"]`, html).addClass("color"));

	name = `${PinCushion.MODULE_NAME}.revealedNotesTintColorNotRevealed`;
	colour = game.settings.get(PinCushion.MODULE_NAME, "revealedNotesTintColorNotRevealed");
	$("<input>")
		.attr("type", "color")
		.attr("data-edit", name)
		.val(colour)
		.insertAfter($(`input[name="${name}"]`, html).addClass("color"));
});
