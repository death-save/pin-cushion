

/* ------------------------------------ */
/* Other Hooks							*/
/* ------------------------------------ */

import API from "./module/api.js";
import CONSTANTS from "./module/constants.js";
import { log, debug, is_real_number } from "./module/lib/lib.js";
import { registerSettings } from "./module/settings.js";
import { pinCushionSocket, registerSocket } from "./module/socket.js";
import { BackgroundlessControlIcon } from './module/apps/BackgroundlessControlIcon';
import { PinCushionHUD } from './module/apps/PinCushionHUD.js';
import { PinCushion } from './module/apps/PinCushion.js';

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

Hooks.once('libChangelogsReady', function () {
  //@ts-ignore
  libChangelogs.registerConflict(
    PinCushion.MODULE_NAME,
    'backgroundless-pins',
    `Redundancy of features you can disable 'FVTT Backgroundless Pins' module if you want`,
    'major',
  );
  //@ts-ignore
  libChangelogs.registerConflict(
    PinCushion.MODULE_NAME,
    'journal-thumbnail',
    `Redundancy of features you can disable 'Thumbnails for Journal Entries' module if you want`,
    'major',
  );
  //@ts-ignore
  libChangelogs.registerConflict(
    PinCushion.MODULE_NAME,
    'gmtext-in-notes',
    `Redundancy of features you can disable 'GM-only tooltips for Notes' module if you want`,
    'major',
  );
  //@ts-ignore
  libChangelogs.registerConflict(
    PinCushion.MODULE_NAME,
    'revealed-notes-manager',
    `Redundancy of features you can disable 'Revealed Notes Manager' module if you want`,
    'major',
  );
  //@ts-ignore
  libChangelogs.registerConflict(
    PinCushion.MODULE_NAME,
    'journal-sidebar-images',
    `Redundancy of features you can disable 'Journal Sidebar Images' module if you want`,
    'major',
  );
  //@ts-ignore
  libChangelogs.registerConflict(
    PinCushion.MODULE_NAME,
    'map-note-hover-display',
    `Redundancy of features you can disable 'Map Note Hover Display' module if you want`,
    'major',
  );
  //@ts-ignore
  libChangelogs.register(
    PinCushion.MODULE_NAME,
    `
    - change default value of module setting 'showJournalPreview' from false to true
    - Add new note config setting 'doNotShowJournalPreview' for hide the tooltip preview to players
    `,
    'minor',
  );
});

/* -------------------------------------------------------------------------- */
/*                                    Hooks                                   */
/* -------------------------------------------------------------------------- */

/* ------------------------------------ */
/* Initialize module					*/
/* ------------------------------------ */
Hooks.once('init', function () {
  log(' init ' + CONSTANTS.MODULE_NAME);

  globalThis.PinCushion = PinCushion;
  // globalThis.setNoteRevealed = setNoteRevealed; // Seem not necessary
  // globalThis.setNoteGMtext = setNoteGMtext // Seem not necessary
  PinCushion._registerSettings();

  Hooks.once('socketlib.ready', registerSocket);

  libWrapper.register(
    PinCushion.MODULE_NAME,
    "NotesLayer.prototype._onClickLeft2",
    PinCushion._onDoubleClick,
    "OVERRIDE",
  );

  // const enableBackgroundlessPins = game.settings.get(PinCushion.MODULE_NAME, "enableBackgroundlessPins");
  // if (enableBackgroundlessPins) {
  //   libWrapper.register(
  //     PinCushion.MODULE_NAME,
  //     "Note.prototype._drawControlIcon",
  //     PinCushion._drawControlIcon,
  //     "OVERRIDE",
  //   );
  // }

  const enablePlayerIconAutoOverride = game.settings.get(PinCushion.MODULE_NAME, "playerIconAutoOverride");
  if (enablePlayerIconAutoOverride) {
    libWrapper.register(
      PinCushion.MODULE_NAME,
      "NoteDocument.prototype.prepareData",
      PinCushion._onPrepareNoteData,
      "WRAPPER",
    );
  }
});

/* ------------------------------------ */
/* Setup module							*/
/* ------------------------------------ */
Hooks.once('setup', function () {
  setApi(API);
});

/* ------------------------------------ */
/* When ready							*/
/* ------------------------------------ */

Hooks.once('ready', function () {
  if (!game.modules.get('lib-wrapper')?.active && game.user?.isGM) {
    let word = 'install and activate';
    if (game.modules.get('lib-wrapper')) word = 'activate';
    throw error(`Requires the 'libWrapper' module. Please ${word} it.`);
  }
  if (!game.modules.get('socketlib')?.active && game.user?.isGM) {
    let word = 'install and activate';
    if (game.modules.get('socketlib')) word = 'activate';
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
Hooks.on("renderNoteConfig", async (app, html, data) => {
  if(!app.object.data.flags[PinCushion.MODULE_NAME]){
    app.object.data.flags[PinCushion.MODULE_NAME] = {};
  }
  const showJournalImageByDefault = game.settings.get(PinCushion.MODULE_NAME, "showJournalImageByDefault");

  if (showJournalImageByDefault) {
    // Journal id
    const journal = game.journal.get(data.data.entryId);
    if (journal?.data.img && !app.object.getFlag(PinCushion.MODULE_NAME, PinCushion.FLAGS.CUSHION_ICON)) {
      data.data.icon = journal.data.img;
    }
  }
  let tmp = data.data.icon;
  if (app.object.getFlag(PinCushion.MODULE_NAME, PinCushion.FLAGS.CUSHION_ICON)) {
    data.data.icon = app.object.getFlag(PinCushion.MODULE_NAME, PinCushion.FLAGS.CUSHION_ICON);
  }
  PinCushion._replaceIconSelector(app, html, data);
  //Causes a bug when attempting to place an journal entry onto the canvas in Foundry 9.
  //await app.object.setFlag(PinCushion.MODULE_NAME, PinCushion.FLAGS.CUSHION_ICON, tmp);
  setProperty(app.object.data.flags[PinCushion.MODULE_NAME],PinCushion.FLAGS.CUSHION_ICON,tmp);

  PinCushion._addShowImageField(app, html, data);

  const enableBackgroundlessPins = game.settings.get(PinCushion.MODULE_NAME, "enableBackgroundlessPins");
  if (enableBackgroundlessPins) {
    PinCushion._addBackgroundField(app, html, data);
  }

  const enablePlayerIcon = game.settings.get(PinCushion.MODULE_NAME, "playerIconAutoOverride");
  if (enablePlayerIcon ) {
    PinCushion._addPlayerIconField(app, html, data);
  }

  const enableNoteGM = game.settings.get(PinCushion.MODULE_NAME, "noteGM");
  if (enableNoteGM) {
    PinCushion._addNoteGM(app, html, data);
  }

  const enableNoteTintColorLink = game.settings.get(PinCushion.MODULE_NAME, "revealedNotes");
  if (enableNoteTintColorLink) {
    PinCushion._addNoteTintColorLink(app, html, data);
  }

  PinCushion._addHideLabel(app, html, data);
  PinCushion._addDoNotshowJournalPreview(app, html, data);
  PinCushion._addTooltipHandler(app, html, data);

});

/**
 * Hook on render HUD
 */
Hooks.on("renderHeadsUpDisplay", (app, html, data) => {
    const showPreview = game.settings.get(PinCushion.MODULE_NAME, "showJournalPreview");
    if (showPreview) {
        html.append(`<template id="pin-cushion-hud"></template>`);
        canvas.hud.pinCushion = new PinCushionHUD();
    }
});

/**
 * Hook on Note hover
 */
Hooks.on("hoverNote", (note, hovered) => {
    const showPreview = game.settings.get(PinCushion.MODULE_NAME, "showJournalPreview");
    const previewDelay = game.settings.get(PinCushion.MODULE_NAME, "previewDelay");
    const doNotShowJournalPreview =
      getProperty(note, `data.flags.${PinCushion.MODULE_NAME}.${PinCushion.FLAGS.DO_NOT_SHOW_JOURNAL_PREVIEW}`);

    if (!showPreview || doNotShowJournalPreview) {
        return;
    }

    if (!hovered) {
        clearTimeout(game.pinCushion.hoverTimer);
        return canvas.hud.pinCushion.clear();
    }

    // If the note is hovered by the mouse cursor (not via alt/option)
    if (hovered && note.mouseInteractionManager.state === 1) {
        game.pinCushion.hoverTimer = setTimeout(function() {
          canvas.hud.pinCushion.bind(note)
        }, previewDelay);
        return;
    }else{
      canvas.hud.pinCushion.clear();
    }
});

/**
 * Hook on render Journal Directory
 */
Hooks.on("renderJournalDirectory", (app, html, data) => {
  PinCushion._addJournalThumbnail(app, html, data);
});

Hooks.once('canvasInit', () => {
	// This module is only required for GMs (game.user accessible from 'ready' event but not 'init' event)
	if (game.user.isGM && game.settings.get(PinCushion.MODULE_NAME, "noteGM")) {
		libWrapper.register(
      PinCushion.MODULE_NAME,
      'Note.prototype._drawTooltip',
      PinCushion._addDrawTooltip,
      'WRAPPER'
    );
	} else {
    libWrapper.register(
      PinCushion.MODULE_NAME,
      'Note.prototype._drawTooltip',
      PinCushion._addDrawTooltip2,
      'MIXED'
    );
  }
  // This is only required for Players, not GMs (game.user accessible from 'ready' event but not 'init' event)
  const revealedNotes = game.settings.get(PinCushion.MODULE_NAME, "revealedNotes");
	if (!game.user.isGM && revealedNotes) {
		libWrapper.register(
      PinCushion.MODULE_NAME,
      'Note.prototype.refresh',
      PinCushion._noteRefresh,
      'WRAPPER'
    );
  }else{
    libWrapper.register(
      PinCushion.MODULE_NAME,
      'Note.prototype.refresh',
      PinCushion._noteRefresh2,
      'WRAPPER'
    );
  }
  const enableBackgroundlessPins = game.settings.get(PinCushion.MODULE_NAME, "enableBackgroundlessPins");
  if (enableBackgroundlessPins) {
    libWrapper.register(
      PinCushion.MODULE_NAME,
      "Note.prototype._drawControlIcon",
      PinCushion._drawControlIcon,
      "OVERRIDE",
    );
  }else{
    if(!game.user.isGM && revealedNotes){
      libWrapper.register(
        PinCushion.MODULE_NAME,
        'Note.prototype._drawControlIcon',
        PinCushion._drawControlIcon2,
        'WRAPPER'
      );
    }
  }
});

Hooks.on("renderSettingsConfig", (app, html, data) => {
	// Add colour pickers to the Configure Game Settings: Module Settings menu
	let name,colour;
	name   = `${PinCushion.MODULE_NAME}.revealedNotesTintColorLink`;
	colour = game.settings.get(PinCushion.MODULE_NAME, "revealedNotesTintColorLink");
	$('<input>').attr('type', 'color').attr('data-edit', name).val(colour).insertAfter($(`input[name="${name}"]`, html).addClass('color'));

	name   = `${PinCushion.MODULE_NAME}.revealedNotesTintColorNotLink`;
	colour = game.settings.get(PinCushion.MODULE_NAME, "revealedNotesTintColorNotLink");
	$('<input>').attr('type', 'color').attr('data-edit', name).val(colour).insertAfter($(`input[name="${name}"]`, html).addClass('color'));
});
