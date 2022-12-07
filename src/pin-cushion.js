/* ------------------------------------ */
/* Other Hooks							*/
/* ------------------------------------ */

import API from "./scripts/api.js";
import CONSTANTS from "./scripts/constants.js";
import {
	log,
	debug,
	is_real_number,
	stripQueryStringAndHashFromPath,
	error,
	retrieveFirstImageFromJournalId,
} from "./scripts/lib/lib.js";
import { registerSettings } from "./scripts/settings.js";
import { pinCushionSocket, registerSocket } from "./scripts/socket.js";
import { PinCushionHUD } from "./scripts/apps/PinCushionHUD.js";
import { PinCushion } from "./scripts/apps/PinCushion.js";

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
	// TODO TO REMOVE
	globalThis.PinCushion = PinCushion;
	// globalThis.setNoteRevealed = setNoteRevealed; // Seem not necessary
	// globalThis.setNoteGMtext = setNoteGMtext // Seem not necessary
	registerSettings();

	// href: https://stackoverflow.com/questions/8853396/logical-operator-in-a-handlebars-js-if-conditional/16315366#16315366
	Handlebars.registerHelper('ifCond', function (v1, operator, v2, options) {

		switch (operator) {
			case '==':
				return (v1 == v2) ? options.fn(this) : options.inverse(this);
			case '===':
				return (v1 === v2) ? options.fn(this) : options.inverse(this);
			case '!=':
				return (v1 != v2) ? options.fn(this) : options.inverse(this);
			case '!==':
				return (v1 !== v2) ? options.fn(this) : options.inverse(this);
			case '<':
				return (v1 < v2) ? options.fn(this) : options.inverse(this);
			case '<=':
				return (v1 <= v2) ? options.fn(this) : options.inverse(this);
			case '>':
				return (v1 > v2) ? options.fn(this) : options.inverse(this);
			case '>=':
				return (v1 >= v2) ? options.fn(this) : options.inverse(this);
			case '&&':
				return (v1 && v2) ? options.fn(this) : options.inverse(this);
			case '||':
				return (v1 || v2) ? options.fn(this) : options.inverse(this);
			default:
				return options.inverse(this);
		}
	});

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
	let entity = app.object.flags[PinCushion.MODULE_NAME] || {};

	// TODO THIS CODE CAN B DONE MUCH BETTER...
	const showJournalImageByDefault = game.settings.get(PinCushion.MODULE_NAME, "showJournalImageByDefault");

	if (
		showJournalImageByDefault &&
		noteData.document.entryId &&
		!app.object.getFlag(PinCushion.MODULE_NAME, PinCushion.FLAGS.CUSHION_ICON)
	) {
		// Journal id
		const journal = game.journal.get(noteData.document.entryId);
		const journalEntryImage = retrieveFirstImageFromJournalId(journal.id, app.object.pageId, false);
		if (journalEntryImage) {
			setProperty(noteData.document.texture, "src", stripQueryStringAndHashFromPath(journalEntryImage));
		}
	}
	let tmp = undefined;
	if (noteData.icon.custom) {
		tmp = stripQueryStringAndHashFromPath(noteData.icon.custom);
	} else if (app.object.texture.src) {
		tmp = stripQueryStringAndHashFromPath(app.object.texture.src);
	} else if (noteData.document.texture.src) {
		tmp = stripQueryStringAndHashFromPath(noteData.document.texture.src);
	}
	// TODO find a better method
	if (tmp === "icons/svg/book.svg" && noteData.icon.custom) {
		tmp = stripQueryStringAndHashFromPath(noteData.icon.custom);
	}
	if (tmp === "icons/svg/book.svg" && noteData.document.texture.src) {
		tmp = stripQueryStringAndHashFromPath(noteData.document.texture.src);
	}
	const pinCushionIcon = getProperty(app.object.flags, `${PinCushion.MODULE_NAME}.${PinCushion.FLAGS.CUSHION_ICON}`);
	if (pinCushionIcon) {
		tmp = stripQueryStringAndHashFromPath(pinCushionIcon);
	}
	PinCushion._replaceIconSelector(app, html, noteData, tmp);
	//Causes a bug when attempting to place an journal entry onto the canvas in Foundry 9.
	//await app.object.setFlag(PinCushion.MODULE_NAME, PinCushion.FLAGS.CUSHION_ICON, tmp);
	setProperty(app.object.flags[PinCushion.MODULE_NAME], PinCushion.FLAGS.CUSHION_ICON, tmp);

	// PinCushion._addShowImageField(app, html, noteData);
	// PinCushion._addPinIsTransparentField(app, html, noteData);
	// PinCushion._addShowOnlyToGMField(app, html, noteData);
	// PinCushion._addBackgroundField(app, html, noteData);
	// PinCushion._addHideLabel(app, html, noteData);

	// const enablePlayerIcon = game.settings.get(PinCushion.MODULE_NAME, "playerIconAutoOverride");
	// if (enablePlayerIcon) {
	// 	PinCushion._addPlayerIconField(app, html, noteData);
	// }

	const enableNoteGM = game.settings.get(PinCushion.MODULE_NAME, "noteGM");
	if (enableNoteGM) {
		PinCushion._addNoteGM(app, html, noteData);
	}

	// const enableNoteTintColorLink = game.settings.get(PinCushion.MODULE_NAME, "revealedNotes");
	// if (enableNoteTintColorLink) {
	//	PinCushion._addNoteTintColorLink(app, html, noteData);
	// }
	
	// PinCushion._addPreviewAsTextSnippet(app, html, noteData);
	// PinCushion._addDoNotShowJournalPreview(app, html, noteData);
	
	PinCushion._addTooltipHandler(app, html, noteData);

	// TODO
	//PinCushion._addAboveFog(app, html, data);

	// ====================================
	// SUPPORT MATT
	// ====================================
	let triggerData = {};
	if(game.modules.get('monks-active-tiles')?.active){
		let entity = app.object.flags['monks-active-tiles']?.entity || {};
		if (typeof entity == "string" && entity) {
			entity = JSON.parse(entity);
		}
		let tilename = "";
		if (entity.id) {
			tilename = await MonksActiveTiles.entityName(entity);
		}
		triggerData = mergeObject(
			{ 
				tilename: tilename, 
				showtagger: game.modules.get('tagger')?.active 
			}, 
			(app.object.flags['monks-active-tiles'] || {})
		);
		triggerData.entity = JSON.stringify(entity);
	}

	// ====================================
	// General
	// ====================================
	const showImageExplicitSource = stripQueryStringAndHashFromPath(
		app.object.getFlag(PinCushion.MODULE_NAME, PinCushion.FLAGS.SHOW_IMAGE_EXPLICIT_SOURCE) ?? ""
	);
	const showImage = app.object.getFlag(PinCushion.MODULE_NAME, PinCushion.FLAGS.SHOW_IMAGE) ?? false;
	const pinIsTransparent = app.object.getFlag(PinCushion.MODULE_NAME, PinCushion.FLAGS.PIN_IS_TRANSPARENT) ?? false;
	const showOnlyToGM = app.object.getFlag(PinCushion.MODULE_NAME, PinCushion.FLAGS.SHOW_ONLY_TO_GM) ?? false;

	const hasBackground =
		(app.document
			? app.document.getFlag(PinCushion.MODULE_NAME, PinCushion.FLAGS.HAS_BACKGROUND)
			: app.object.getFlag(PinCushion.MODULE_NAME, PinCushion.FLAGS.HAS_BACKGROUND)) ?? 0;
	const ratio =
		(app.document
			? app.document.getFlag(PinCushion.MODULE_NAME, PinCushion.FLAGS.RATIO)
			: app.object.getFlag(PinCushion.MODULE_NAME, PinCushion.FLAGS.RATIO)) ?? 1;
	const textAlwaysVisible =
		(app.document
			? app.document.getFlag(PinCushion.MODULE_NAME, PinCushion.FLAGS.TEXT_ALWAYS_VISIBLE)
			: app.object.getFlag(PinCushion.MODULE_NAME, PinCushion.FLAGS.TEXT_ALWAYS_VISIBLE)) ?? false;
	const hideLabel =
		(app.document
			? app.document.getFlag(PinCushion.MODULE_NAME, PinCushion.FLAGS.HIDE_LABEL)
			: app.object.getFlag(PinCushion.MODULE_NAME, PinCushion.FLAGS.HIDE_LABEL)) ?? false;

	// ====================================
	// enablePlayerIcon
	// ====================================
	const enablePlayerIcon = game.settings.get(PinCushion.MODULE_NAME, "playerIconAutoOverride");
	// Adds fields to set player-only note icons
	// Get default values set by GM
	const defaultState = game.settings.get(PinCushion.MODULE_NAME, "playerIconAutoOverride") ?? ``;
	const defaultPath = game.settings.get(PinCushion.MODULE_NAME, "playerIconPathDefault") ?? ``;

	const playerIconState =
		getProperty(noteData, `document.flags.${PinCushion.MODULE_NAME}.${PinCushion.FLAGS.PLAYER_ICON_STATE}`) ??
		defaultState;
	const playerIconPath = stripQueryStringAndHashFromPath(
		getProperty(noteData, `document.flags.${PinCushion.MODULE_NAME}.${PinCushion.FLAGS.PLAYER_ICON_PATH}`) ??
			defaultPath
	);

	// ====================================
	// revealedNotes
	// ====================================
	const enableNoteTintColorLink = game.settings.get(PinCushion.MODULE_NAME, "revealedNotes");
	let pinIsRevealed = getProperty(noteData, `document.flags.${PinCushion.MODULE_NAME}.${PinCushion.FLAGS.PIN_IS_REVEALED}`) ?? true;
	// Check box for REVEALED state
	let usePinIsRevealed = getProperty(noteData, `document.flags.${PinCushion.MODULE_NAME}.${PinCushion.FLAGS.USE_PIN_REVEALED}`) ?? false;

	// ====================================
	// Tooltip
	// ====================================

	let doNotShowJournalPreviewS = String(
		app.document
			? app.document.getFlag(PinCushion.MODULE_NAME, PinCushion.FLAGS.DO_NOT_SHOW_JOURNAL_PREVIEW)
			: app.object.getFlag(PinCushion.MODULE_NAME, PinCushion.FLAGS.DO_NOT_SHOW_JOURNAL_PREVIEW)
	);
	if (doNotShowJournalPreviewS !== "true" && doNotShowJournalPreviewS !== "false") {
		doNotShowJournalPreviewS = "true";
	}
	const doNotShowJournalPreview = String(doNotShowJournalPreviewS) === "true" ? true : false;

	const previewAsTextSnippet =
		(app.document
			? app.document.getFlag(PinCushion.MODULE_NAME, PinCushion.FLAGS.PREVIEW_AS_TEXT_SNIPPET)
			: app.object.getFlag(PinCushion.MODULE_NAME, PinCushion.FLAGS.PREVIEW_AS_TEXT_SNIPPET)) ?? false;

	const tooltipPlacement =
		(app.document
			? app.document.getFlag(PinCushion.MODULE_NAME, PinCushion.FLAGS.TOOLTIP_PLACEMENT)
			: app.object.getFlag(PinCushion.MODULE_NAME, PinCushion.FLAGS.TOOLTIP_PLACEMENT)) ?? "e";

	const tooltipColor =
		(app.document
			? app.document.getFlag(PinCushion.MODULE_NAME, PinCushion.FLAGS.TOOLTIP_COLOR)
			: app.object.getFlag(PinCushion.MODULE_NAME, PinCushion.FLAGS.TOOLTIP_COLOR)) ?? "";

	const tooltipForceRemove =
		(app.document
			? app.document.getFlag(PinCushion.MODULE_NAME, PinCushion.FLAGS.TOOLTIP_FORCE_REMOVE)
			: app.object.getFlag(PinCushion.MODULE_NAME, PinCushion.FLAGS.TOOLTIP_FORCE_REMOVE)) ?? false;

	const tooltipSmartPlacement =
		(app.document
			? app.document.getFlag(PinCushion.MODULE_NAME, PinCushion.FLAGS.TOOLTIP_SMART_PLACEMENT)
			: app.object.getFlag(PinCushion.MODULE_NAME, PinCushion.FLAGS.TOOLTIP_SMART_PLACEMENT)) ?? false;

	const tooltipFollowMouse =
		(app.document
			? app.document.getFlag(PinCushion.MODULE_NAME, PinCushion.FLAGS.TOOLTIP_FOLLOW_MOUSE)
			: app.object.getFlag(PinCushion.MODULE_NAME, PinCushion.FLAGS.TOOLTIP_FOLLOW_MOUSE)) ?? false;

	// ====================================
	// Other
	// ====================================
	const enableBackgroundlessPins = game.settings.get(PinCushion.MODULE_NAME, "enableBackgroundlessPins");
	

	let pinCushionData = mergeObject(
		{ 
			yesUploadFile: game.user.can("FILES_BROWSE"),
			noUploadFile: !game.user.can("FILES_BROWSE"),
			showImageExplicitSource: showImageExplicitSource,

			showImage: showImage,
			pinIsTransparent: pinIsTransparent,
			showOnlyToGM: showOnlyToGM,
			hasBackground: hasBackground,
			ratio: ratio,
			textAlwaysVisible: textAlwaysVisible,
			hideLabel: hideLabel,

			enablePlayerIcon: enablePlayerIcon,
			playerIconState: playerIconState,
			playerIconPath: playerIconPath,

			enableNoteTintColorLink: enableNoteTintColorLink,
			pinIsRevealed: pinIsRevealed,
			usePinIsRevealed: usePinIsRevealed,

			previewAsTextSnippet: previewAsTextSnippet,
			doNotShowJournalPreview: doNotShowJournalPreview,

			enableBackgroundlessPins: enableBackgroundlessPins,	
			enableNoteGM: enableNoteGM,

			entity: triggerData?.entity || {},
			tilename: tilename, 
			showtagger: game.modules.get('tagger')?.active 
		}, 
		(app.object.flags[PinCushion.MODULE_NAME] || {}));
	// pinCushionData.entity = JSON.stringify(entity);
	let noteHtml = await renderTemplate(`modules/${PinCushion.MODULE_NAME}/templates/note-config.html`, pinCushionData);

	if ($('.sheet-tabs', html).length) {
		$('.sheet-tabs', html).append($('<a>').addClass("item").attr("data-tab", "pincushion").html('<i class="fas fa-map-marker-plus"></i> Pin Cushion'));
		$('<div>').addClass("tab action-sheet").attr('data-tab', 'pincushion').html(noteHtml).insertAfter($('.tab:last', html));
	} else {
		let root = $('form', html);
		if (root.length == 0)
			root = html;
		let basictab = $('<div>').addClass("tab").attr('data-tab', 'basic');
		$('> *:not(button)', root).each(function () {
			basictab.append(this);
		});

		$(root).prepend($('<div>').addClass("tab action-sheet").attr('data-tab', 'pincushion').html(noteHtml)).prepend(basictab).prepend(
			$('<nav>')
				.addClass("sheet-tabs tabs")
				.append($('<a>').addClass("item active").attr("data-tab", "basic").html('<i class="fas fa-university"></i> Basic'))
				.append($('<a>').addClass("item").attr("data-tab", "pincushion").html('<i class="fas fa-map-marker-plus"></i> Pin Cushion')) 
		);
	}

	// START LISTENERS

	// SUPPORT MATT
	if(game.modules.get('monks-active-tiles')?.active){
		$('button[data-type="entity"]', html).on("click", ActionConfig.selectEntity.bind(app));
		$('button[data-type="tagger"]', html).on("click", ActionConfig.addTag.bind(app));
	}

	html.find("button.file-picker-showImageExplicitSource").each(
		(i, button) => (button.onclick = app._activateFilePicker.bind(app))
	);
	const iconCustomSelectorExplicit = html.find(
		`input[name='flags.${PinCushion.MODULE_NAME}.${PinCushion.FLAGS.SHOW_IMAGE_EXPLICIT_SOURCE}']`
	);
	if (iconCustomSelectorExplicit?.length > 0) {
		iconCustomSelectorExplicit.on("change", function () {
			const p = iconCustomSelectorExplicit.parent().find(".pin-cushion-explicit-icon");
			p[0].src = this.value;
		});
	}

	// ENDS LISTENERS

	app.options.tabs = [{ navSelector: ".tabs", contentSelector: "form", initial: "basic" }];
	app.options.height = "auto";
	app._tabs = app._createTabHandlers();
	const el = html[0];
	app._tabs.forEach(t => t.bind(el));

	app.setPosition();
	/*
	// Force a recalculation of the height
	if (!app._minimized) {
		let pos = app.position;
		pos.height = "auto";
		app.setPosition(pos);
	}
	*/
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
