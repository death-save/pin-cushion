import CONSTANTS from "../constants.js";
import { registerSettings } from "../settings.js";
import { BackgroundlessControlIcon } from "./BackgroundlessControlIcon.js";

/**
 * A class for managing additional Map Pin functionality
 * @author Evan Clarke (errational#2007)
 */
export class PinCushion {
  constructor() {
    // Storage for requests sent over a socket, pending GM execution
    this._requests = {};
  }

  /* -------------------------------- Constants ------------------------------- */

  static get MODULE_NAME() {
    return CONSTANTS.MODULE_NAME;
    // return "pin-cushion";
  }

  static get MODULE_TITLE() {
    return CONSTANTS.MODULE_TITLE;
    // return "Pin Cushion";
  }

  static get PATH() {
    return CONSTANTS.PATH;
    // return "modules/pin-cushion";
  }

  static get DIALOG() {
    const defaultPermission = game.settings.get(PinCushion.MODULE_NAME, 'defaultJournalPermission');
    const defaultFolder = game.settings.get(PinCushion.MODULE_NAME, 'defaultJournalFolder');
    const settingSpecificFolder = game.settings.get(PinCushion.MODULE_NAME, 'specificFolder');
    const folders = game.journal.directory.folders
      .sort((a, b) => a.name.localeCompare(b.name))
      .filter((folder) => folder.displayed)
      .map((folder) => `<option value="${folder.id}">${folder.name}</option>`)
      .join('\n');
    return {
      content: `
            <div class="form-group">
              <p class="notes">${game.i18n.localize('PinCushion.Name')}</p>
              </label>
              <input name="name" type="text">
              <p class="notes">${game.i18n.localize('PinCushion.DefaultPermission')}</p>
              </label>
              <select id="cushion-permission" style="width: 100%;">
                <option value="0" ${defaultPermission == '0' ? 'selected' : ''}>${game.i18n.localize(
        'PERMISSION.NONE',
      )}</option>
                <option value="1" ${defaultPermission == '1' ? 'selected' : ''}>${game.i18n.localize(
        'PERMISSION.LIMITED',
      )}</option>
                <option value="2" ${defaultPermission == '2' ? 'selected' : ''}>${game.i18n.localize(
        'PERMISSION.OBSERVER',
      )}</option>
                <option value="3" ${defaultPermission == '3' ? 'selected' : ''}>${game.i18n.localize(
        'PERMISSION.OWNER',
      )}</option>
              </select>
              <p class="notes">${game.i18n.localize('PinCushion.Folder')}</p>
              </label>
              <select id="cushion-folder" style="width: 100%;">
                <option value="none" ${defaultFolder == 'none' ? 'selected' : ''}>${game.i18n.localize(
        'PinCushion.None',
      )}</option>
                ${
                  game.user.isGM
                    ? ``
                    : `<option value="perUser" ${defaultFolder == 'perUser' ? 'selected' : ''}>${game.i18n.localize(
                        'PinCushion.PerUser',
                      )}</option>`
                }
                <option value="specificFolder" ${
                  defaultFolder == 'specificFolder' ? 'selected' : ''
                }>${game.i18n.localize('PinCushion.PerSpecificFolder')}</option>
                <option disabled>──${game.i18n.localize('PinCushion.ExistingFolders')}──</option>
                ${folders}
              </select>
            </div>
            </br>
            `,
      title: 'Create a Map Pin',
    };
  }

  static get NOTESLAYER() {
    return 'NotesLayer';
  }

  static get FONT_SIZE() {
    return 16;
  }

  static get FLAGS() {
    return {
      USE_PIN_REVEALED: 'usePinRevealed',
      PIN_IS_REVEALED: 'pinIsRevealed',
      PIN_GM_TEXT: 'gmNote',
      HAS_BACKGROUND: 'hasBackground',
      RATIO: 'ratio',
      TEXT_ALWAYS_VISIBLE: 'textAlwaysVisible',
      PLAYER_ICON_STATE: 'PlayerIconState',
      PLAYER_ICON_PATH: 'PlayerIconPath',
      CUSHION_ICON: 'cushionIcon',
      SHOW_IMAGE: 'showImage',
      HIDE_LABEL: 'hideLabel',
      DO_NOT_SHOW_JOURNAL_PREVIEW: 'doNotShowJournalPreview',
      TOOLTIP_PLACEMENT: 'tooltipPlacement',
      TOOLTIP_COLOR: 'tooltipColor',
    };
  }

  /* --------------------------------- Methods -------------------------------- */

  /**
   * Creates and renders a dialog for name entry
   * @param {*} data
   * @todo break callbacks out into separate methods
   */
  _createDialog(data) {
    new Dialog({
      title: PinCushion.DIALOG.title,
      content: PinCushion.DIALOG.content,
      buttons: {
        save: {
          label: 'Save',
          icon: `<i class="fas fa-check"></i>`,
          callback: (html) => {
            return this.createNoteFromCanvas(html, data);
          },
        },
        cancel: {
          label: 'Cancel',
          icon: `<i class="fas fa-times"></i>`,
          callback: (e) => {
            // Maybe do something in the future
          },
        },
      },
      default: 'save',
    }).render(true);
  }

  /**
   * Creates a Note from the Pin Cushion dialog
   * @param {*} html
   * @param {*} data
   */
  async createNoteFromCanvas(html, eventData) {
    const input = html.find("input[name='name']");

    if (!input[0].value) {
      ui.notifications.warn(game.i18n.localize('PinCushion.MissingPinName'));
      return;
    }
    // Permissions the Journal Entry will be created with
    const permission = {
      [game.userId]: CONST.ENTITY_PERMISSIONS.OWNER,
      default: parseInt($('#cushion-permission').val()),
    };

    // Get folder ID for Journal Entry
    let folder;
    const selectedFolder = $('#cushion-folder').val();
    if (selectedFolder === 'none') {
      folder = undefined;
    } else if (selectedFolder === 'perUser') {
      folder = PinCushion.getFolder(game.user.name, selectedFolder);
      if (!game.user.isGM && folder === undefined) {
        // Request folder creation when perUser is set and the entry is created by a user
        // Since only the ID is required, instantiating a Folder from the data is not necessary
        // folder = (await PinCushion.requestEvent({ action: "createFolder" }))?._id;
        // TODO for some reason this will give me a error
        // folder = (await pinCushionSocket.executeAsGM('requestEvent', { action: "createFolder" }))?._id;
      }
    } else if (selectedFolder === 'specificFolder') {
      const settingSpecificFolder = game.settings.get(PinCushion.MODULE_NAME, 'specificFolder');
      folder = PinCushion.getFolder(game.user.name, selectedFolder, settingSpecificFolder);
    } else {
      folder = selectedFolder; // Folder is already given as ID
    }
    const entry = await JournalEntry.create({ name: `${input[0].value}`, permission, ...(folder && { folder }) });

    if (!entry) {
      return;
    }

    // offsely add fields required by Foundry's drop handling
    const entryData = entry.data.toJSON();
    entryData.id = entry.id;
    entryData.type = 'JournalEntry';

    if (canvas.activeLayer.name !== PinCushion.NOTESLAYER) {
      await canvas.notes.activate();
    }

    await canvas.activeLayer._onDropData(eventData, entryData);
  }

  // /**
  //  * Request an action to be executed with GM privileges.
  //  *
  //  * @static
  //  * @param {object} message - The object that will get emitted via socket
  //  * @param {string} message.action - The specific action to execute
  //  * @returns {Promise} The promise of the action which will be resolved after execution by the GM
  //  */
  // static requestEvent(message) {
  //     // A request has to define what action should be executed by the GM
  //     if (!"action" in message) return;

  //     const promise = new Promise((resolve, reject) => {
  //         const id = `${game.user.id}_${Date.now()}_${randomID()}`;
  //         message.id = id;
  //         game.pinCushion._requests[id] = {resolve, reject};
  //         game.socket.emit(`module.${PinCushion.MODULE_NAME}`, message);
  //         setTimeout(() => {
  //             delete game.pinCushion._requests[id];
  //             reject(new Error (`${PinCushion.MODULE_TITLE} | Call to ${message.action} timed out`));
  //         }, 5000);
  //     });
  //     return promise;
  // }

  /**
   * Gets the JournalEntry Folder ID to be used for JournalEntry creations, if any.
   *
   * @static
   * @param {string} name - The player name to check folders against, defaults to current user's name
   * @param {string} setting - The module setting set for journal default
   * @param {string} folderName - The explicit name of the folder
   * @returns {string|undefined} The folder's ID, or undefined if there is no target folder
   */
  static getFolder(name, setting, folderName) {
    name = name ?? game.user.name;
    switch (setting) {
      // No target folder set
      case 'none':
        return undefined;
      // Target folder should match the user's name
      case 'perUser':
        return game.journal.directory.folders.find((f) => f.name === name)?.id ?? undefined;
      case 'specificFolder':
        return game.journal.directory.folders.find((f) => f.name === folderName)?.id ?? undefined;
      default:
        return name;
    }
  }

  /**
   * Checks for missing Journal Entry folders and creates them
   *
   * @static
   * @private
   * @returns {void}
   */
  static async _createFolders() {
    // Collect missing folders
    const setting = game.settings.get(PinCushion.MODULE_NAME, 'defaultJournalFolder');
    const missingFolders = game.users
      .filter((u) => !u.isGM && PinCushion.getFolder(u.name, setting) === undefined)
      .map((user) => ({
        name: user.name,
        type: 'JournalEntry',
        parent: null,
        sorting: 'a',
      }));
    if (missingFolders.length) {
      // Ask for folder creation confirmation in a dialog
      const createFolders = await new Promise((resolve, reject) => {
        new Dialog({
          title: game.i18n.localize('PinCushion.CreateMissingFoldersT'),
          content: game.i18n.localize('PinCushion.CreateMissingFoldersC'),
          buttons: {
            yes: {
              label: `<i class="fas fa-check"></i> ${game.i18n.localize('Yes')}`,
              callback: () => resolve(true),
            },
            no: {
              label: `<i class="fas fa-times"></i> ${game.i18n.localize('No')}`,
              callback: () => reject(),
            },
          },
          default: 'yes',
          close: () => reject(),
        }).render(true);
      }).catch((_) => {});
      // Create folders
      if (createFolders) await Folder.create(missingFolders);
    }
  }

  /**
   * Replaces icon selector in Notes Config form with filepicker
   * @param {*} app
   * @param {*} html
   * @param {*} data
   */
  static _replaceIconSelector(app, html, data) {
    // you can see this only if you have the file browser permissions
    if (game.user.can('FILES_BROWSE')) {
      const filePickerHtml = `<input type="text" name="icon" title="Icon Path" class="icon-path" value="${data.data.icon}" placeholder="/icons/example.svg" data-dtype="String">
      <button type="button" name="file-picker" class="file-picker" data-type="image" data-target="icon" title="Browse Files" tabindex="-1">
      <i class="fas fa-file-import fa-fw"></i>
      </button>`;
      const iconSelector = html.find("select[name='icon']");

      iconSelector.replaceWith(filePickerHtml);

      // Detect and activate file-picker buttons
      //html.find("button.file-picker").on("click", app._activateFilePicker.bind(app));
      html.find('button.file-picker').each((i, button) => (button.onclick = app._activateFilePicker.bind(app)));
    }
  }

  static _addTooltipHandler(app, html, data) {
    const iconAnchor = html.find('[name=icon]').closest('.form-group');
    const tooltipPlacement =
      (app.document
        ? app.document.getFlag(PinCushion.MODULE_NAME, PinCushion.FLAGS.TOOLTIP_PLACEMENT)
        : app.object.getFlag(PinCushion.MODULE_NAME, PinCushion.FLAGS.TOOLTIP_PLACEMENT)) ?? 'e';

    const tooltipColor =
      (app.document
        ? app.document.getFlag(PinCushion.MODULE_NAME, PinCushion.FLAGS.TOOLTIP_COLOR)
        : app.object.getFlag(PinCushion.MODULE_NAME, PinCushion.FLAGS.TOOLTIP_COLOR)) ?? '';

    iconAnchor.after(`
      <div class="form-group">
        <label for="flags.${PinCushion.MODULE_NAME}.${PinCushion.FLAGS.TOOLTIP_PLACEMENT}">${game.i18n.localize(
      'PinCushion.Tooltip.Placement.title',
    )}</label>
        <div class="form-fields">
          <select id="cushion-permission" style="width: 100%;" name="flags.${PinCushion.MODULE_NAME}.${
      PinCushion.FLAGS.TOOLTIP_PLACEMENT
    }">
            <option value="nw-alt" ${tooltipPlacement == 'nw-alt' ? 'selected' : ''}>${game.i18n.localize(
      'PinCushion.Tooltip.Placement.choices.north-west-alt',
    )}</option>
            <option value="nw" ${tooltipPlacement == 'nw' ? 'selected' : ''}>${game.i18n.localize(
      'PinCushion.Tooltip.Placement.choices.north-west',
    )}</option>
            <option value="n" ${tooltipPlacement == 'n' ? 'selected' : ''}>${game.i18n.localize(
      'PinCushion.Tooltip.Placement.choices.north',
    )}</option>
            <option value="ne" ${tooltipPlacement == 'ne' ? 'selected' : ''}>${game.i18n.localize(
      'PinCushion.Tooltip.Placement.choices.north-east',
    )}</option>
            <option value="ne-alt" ${tooltipPlacement == 'ne-alt' ? 'selected' : ''}>${game.i18n.localize(
      'PinCushion.Tooltip.Placement.choices.north-east-alt',
    )}</option>
            <option value="w" ${tooltipPlacement == 'w' ? 'selected' : ''}>${game.i18n.localize(
      'PinCushion.Tooltip.Placement.choices.west',
    )}</option>
            <option value="e" ${tooltipPlacement == 'e' ? 'selected' : ''}>${game.i18n.localize(
      'PinCushion.Tooltip.Placement.choices.east',
    )}</option>
            <option value="sw-alt" ${tooltipPlacement == 'sw-alt' ? 'selected' : ''}>${game.i18n.localize(
      'PinCushion.Tooltip.Placement.choices.south-west-alt',
    )}</option>
            <option value="sw" ${tooltipPlacement == 'sw' ? 'selected' : ''}>${game.i18n.localize(
      'PinCushion.Tooltip.Placement.choices.south-west',
    )}</option>
            <option value="s" ${tooltipPlacement == 's' ? 'selected' : ''}>${game.i18n.localize(
      'PinCushion.Tooltip.Placement.choices.south',
    )}</option>
            <option value="se" ${tooltipPlacement == 'se' ? 'selected' : ''}>${game.i18n.localize(
      'PinCushion.Tooltip.Placement.choices.south-east',
    )}</option>
            <option value="se-alt" ${tooltipPlacement == 'se-alt' ? 'selected' : ''}>${game.i18n.localize(
      'PinCushion.Tooltip.Placement.choices.south-east-alt',
    )}</option>
          </select>
        </div>
      </div>
      <div class="form-group">
        <label for="flags.${PinCushion.MODULE_NAME}.${PinCushion.FLAGS.TOOLTIP_COLOR}">${game.i18n.localize(
      'PinCushion.Tooltip.Color.title',
    )}</label>
        <div class="form-fields">
          <select id="cushion-permission" style="width: 100%;" name="flags.${PinCushion.MODULE_NAME}.${
      PinCushion.FLAGS.TOOLTIP_COLOR
    }">
            <option value="" ${tooltipColor == '' ? 'selected' : ''}>${game.i18n.localize(
      'PinCushion.Tooltip.Color.choices.default',
    )}</option>
            <option value="blue" ${tooltipColor == 'blue' ? 'selected' : ''}>${game.i18n.localize(
      'PinCushion.Tooltip.Color.choices.blue',
    )}</option>
            <option value="dark" ${tooltipColor == 'dark' ? 'selected' : ''}>${game.i18n.localize(
      'PinCushion.Tooltip.Color.choices.dark',
    )}</option>
            <option value="green" ${tooltipColor == 'green' ? 'selected' : ''}>${game.i18n.localize(
      'PinCushion.Tooltip.Color.choices.green',
    )}</option>
            <option value="light" ${tooltipColor == 'light' ? 'selected' : ''}>${game.i18n.localize(
      'PinCushion.Tooltip.Color.choices.light',
    )}</option>
            <option value="orange" ${tooltipColor == 'orange' ? 'selected' : ''}>${game.i18n.localize(
      'PinCushion.Tooltip.Color.choices.orange',
    )}</option>
            <option value="purple" ${tooltipColor == 'purple' ? 'selected' : ''}>${game.i18n.localize(
      'PinCushion.Tooltip.Color.choices.purple',
    )}</option>
            <option value="red" ${tooltipColor == 'red' ? 'selected' : ''}>${game.i18n.localize(
      'PinCushion.Tooltip.Color.choices.red',
    )}</option>
            <option value="yellow" ${tooltipColor == 'yellow' ? 'selected' : ''}>${game.i18n.localize(
      'PinCushion.Tooltip.Color.choices.yellow',
    )}</option>
          </select>
        </div>
      </div>
    `);

    app.setPosition({ height: 'auto' });
  }

  /**
   * Add background field
   * @param {*} app
   * @param {*} html
   * @param {*} data
   */
  static _addBackgroundField(app, html, data) {
    const hasBackground =
      (app.document
        ? app.document.getFlag(PinCushion.MODULE_NAME, PinCushion.FLAGS.HAS_BACKGROUND)
        : app.object.getFlag(PinCushion.MODULE_NAME, PinCushion.FLAGS.HAS_BACKGROUND)) ?? 0;
    const iconTintGroup = html.find('[name=iconTint]').closest('.form-group');
    const ratio =
      (app.document
        ? app.document.getFlag(PinCushion.MODULE_NAME, PinCushion.FLAGS.RATIO)
        : app.object.getFlag(PinCushion.MODULE_NAME, PinCushion.FLAGS.RATIO)) ?? 1;
    const iconSizeGroup = html.find('[name=iconSize]').closest('.form-group');
    const textAlwaysVisible =
      (app.document
        ? app.document.getFlag(PinCushion.MODULE_NAME, PinCushion.FLAGS.TEXT_ALWAYS_VISIBLE)
        : app.object.getFlag(PinCushion.MODULE_NAME, PinCushion.FLAGS.TEXT_ALWAYS_VISIBLE)) ?? false;
    const textAnchorGroup = html.find('[name=textAnchor]').closest('.form-group');

    iconTintGroup.after(`
            <div class="form-group">
                <label for="flags.${PinCushion.MODULE_NAME}.${PinCushion.FLAGS.HAS_BACKGROUND}">${game.i18n.localize(
      'PinCushion.HasBackground',
    )}</label>
                <input type="checkbox" name="flags.${PinCushion.MODULE_NAME}.${
      PinCushion.FLAGS.HAS_BACKGROUND
    }" data-dtype="Boolean" ${hasBackground ? 'checked' : ''}>
            </div>
        `);

    iconSizeGroup.after(`
      <div class="form-group">
          <label for="flags.${PinCushion.MODULE_NAME}.${PinCushion.FLAGS.RATIO}">${game.i18n.localize(
      'PinCushion.HasBackgroundRatio',
    )}</label>
          <input type="text" name="flags.${PinCushion.MODULE_NAME}.${
      PinCushion.FLAGS.RATIO
    }" data-dtype="Number" value="${ratio}">
      </div>
    `);

    textAnchorGroup.after(`
      <div class="form-group">
        <label for="flags.${PinCushion.MODULE_NAME}.${PinCushion.FLAGS.TEXT_ALWAYS_VISIBLE}">${game.i18n.localize(
      'PinCushion.TextAlwaysVisible',
    )}</label>
        <div class="form-fields">
          <input type="checkbox" name="flags.${PinCushion.MODULE_NAME}.${
      PinCushion.FLAGS.TEXT_ALWAYS_VISIBLE
    }" data-dtype="Boolean" ${textAlwaysVisible ? 'checked' : ''}>
        </div>
      </div>
    `);
    app.setPosition({ height: 'auto' });
  }

  /**
   * Add show image field
   * @param {*} app
   * @param {*} html
   * @param {*} data
   */
  static _addShowImageField(app, html, data) {
    const showImage = app.object.getFlag(PinCushion.MODULE_NAME, PinCushion.FLAGS.SHOW_IMAGE) ?? false;
    const iconTintGroup = html.find('[name=iconTint]').closest('.form-group');
    iconTintGroup.after(`
            <div class="form-group">
                <label for="flags.${PinCushion.MODULE_NAME}.${PinCushion.FLAGS.SHOW_IMAGE}">${game.i18n.localize(
      'PinCushion.ShowImage',
    )}</label>
                <input type="checkbox" name="flags.${PinCushion.MODULE_NAME}.${
      PinCushion.FLAGS.SHOW_IMAGE
    }" data-dtype="Boolean" ${showImage ? 'checked' : ''}>
            </div>
        `);
    app.setPosition({ height: 'auto' });
  }

  /**
   * Replaces icon selector in Notes Config form with filepicker and adds fields to set player-only note icons.
   * @param {*} app
   * @param {*} html
   * @param {*} data
   */
  static _addPlayerIconField(app, html, data) {
    /* Adds fields to set player-only note icons */
    /* Get default values set by GM */
    const defaultState = game.settings.get(PinCushion.MODULE_NAME, 'playerIconAutoOverride');
    const defaultPath = game.settings.get(PinCushion.MODULE_NAME, 'playerIconPathDefault');

    const state =
      getProperty(data, `data.flags.${PinCushion.MODULE_NAME}.${PinCushion.FLAGS.PLAYER_ICON_STATE}`) ?? defaultState;
    const path =
      getProperty(data, `data.flags.${PinCushion.MODULE_NAME}.${PinCushion.FLAGS.PLAYER_ICON_PATH}`) ?? defaultPath;

    /* Set HTML to be added to the note-config */
    const playerIconHtml = `<hr>
        <!-- Button to Enable overrides -->
        <div class="form-group">
        <label>${game.i18n.localize('PinCushion.UsePlayerIcon')}</label>
        <div class="form-fields">
        <input type="checkbox" name="flags.${PinCushion.MODULE_NAME}.${
      PinCushion.FLAGS.PLAYER_ICON_STATE
    }" data-dtype="Boolean" ${state ? 'checked' : ``} />
        </div>
        <p class="notes">${game.i18n.localize('PinCushion.PlayerIconHint')}</p>
        </div>

        <!-- Player Icon -->
        <div class="form-group">
        <label>${game.i18n.localize('PinCushion.PlayerIconPath')}</label>
        <!--
        <div class="form-fields">
        <select name="icon">
        </select>
        -->
        <input type="text"
          name="flags.${PinCushion.MODULE_NAME}.${PinCushion.FLAGS.PLAYER_ICON_PATH}"
          title="Icon Path" class="icon-path" value="${path ? path : ``}"
        data-dtype="String">

        <button type="button" name="file-picker"
          class="file-picker" data-type="image"
          data-target="flags.${PinCushion.MODULE_NAME}.${PinCushion.FLAGS.PLAYER_ICON_PATH}"
        title="Browse Files" tabindex="-1">
        <i class="fas fa-file-import fa-fw"></i>
        </button>
        </div>`;

    // Insert Player Icon handling at end of config
    html.find("button[name='submit']").before(playerIconHtml);
  }

  static _addNoteGM(app, html, data) {
    let gmNoteFlagRef = `flags.${PinCushion.MODULE_NAME}.${PinCushion.FLAGS.PIN_GM_TEXT}`;
    // Input for GM Label
    let gmtext = data.document.getFlag(PinCushion.MODULE_NAME, PinCushion.FLAGS.PIN_GM_TEXT);
    if (!gmtext) gmtext = '';
    let gm_text = $(
      `<div class='form-group'><label>GM Label</label><div class='form-fields'><textarea name='${gmNoteFlagRef}'>${
        gmtext ?? ''
      }</textarea></div></div>`,
    );
    html.find("input[name='text']").parent().parent().after(gm_text);

    // Multiline input for Text Label
    let initial_text = data.data.text ?? data.entry.name;
    let label = $(
      `<div class='form-group'><label>Player Label</label><div class='form-fields'><textarea name='text' placeholder='${
        data.entry.name
      }'>${initial_text ?? ''}</textarea></div></div>`,
    );
    html.find("input[name='text']").parent().parent().after(label);

    // Hide the old text label input field
    html.find("input[name='text']").parent().parent().remove();

    //let reveal_icon = $(`<div class='form-group'><label>Icon follows Reveal</label><div class='form-fields'><input type='checkbox' name='useRevealIcon'></div></div>`)
    //html.find("select[name='icon']").parent().parent().after(reveal_icon);

    // Force a recalculation of the height
    if (!app._minimized) {
      let pos = app.position;
      pos.height = 'auto';
      app.setPosition(pos);
    }
  }

  static _addNoteTintColorLink(app, html, data) {
    const FLAG_IS_REVEALED = `flags.${PinCushion.MODULE_NAME}.${PinCushion.FLAGS.PIN_IS_REVEALED}`;
    const FLAG_USE_REVEALED = `flags.${PinCushion.MODULE_NAME}.${PinCushion.FLAGS.USE_PIN_REVEALED}`;

    // Check box to control use of REVEALED state
    let checked =
      data.document.getFlag(PinCushion.MODULE_NAME, PinCushion.FLAGS.PIN_IS_REVEALED) ?? true ? 'checked' : '';
    let revealed_control = $(
      `<div class='form-group'><label>${game.i18n.localize(
        'PinCushion.RevealedToPlayer',
      )}</label><div class='form-fields'><input type='checkbox' name='${FLAG_IS_REVEALED}' ${checked}></div></div>`,
    );
    html.find("select[name='entryId']").parent().parent().after(revealed_control);

    // Check box for REVEALED state
    let use_reveal =
      data.document.getFlag(PinCushion.MODULE_NAME, PinCushion.FLAGS.USE_PIN_REVEALED) ?? false ? 'checked' : '';
    let mode_control = $(
      `<div class='form-group'><label>${game.i18n.localize(
        'PinCushion.UseRevealState',
      )}</label><div class='form-fields'><input type='checkbox' name='${FLAG_USE_REVEALED}' ${use_reveal}></div></div>`,
    );
    html.find("select[name='entryId']").parent().parent().after(mode_control);

    // Force a recalculation of the height
    if (!app._minimized) {
      let pos = app.position;
      pos.height = 'auto';
      app.setPosition(pos);
    }
  }

  static _addHideLabel(app, html, data) {
    const hideLabel =
      (app.document
        ? app.document.getFlag(PinCushion.MODULE_NAME, PinCushion.FLAGS.HIDE_LABEL)
        : app.object.getFlag(PinCushion.MODULE_NAME, PinCushion.FLAGS.HIDE_LABEL)) ?? false;
    const textGroup = html.find('[name=text]').closest('.form-group');
    textGroup.after(`
      <div class="form-group">
        <label for="flags.${PinCushion.MODULE_NAME}.${PinCushion.FLAGS.HIDE_LABEL}">${game.i18n.localize(
      'PinCushion.HideLabel',
    )}</label>
        <div class="form-fields">
          <input type="checkbox" name="flags.${PinCushion.MODULE_NAME}.${
      PinCushion.FLAGS.HIDE_LABEL
    }" data-dtype="Boolean" ${hideLabel ? 'checked' : ''}>
        </div>
      </div>
    `);
  }

  static _addDoNotshowJournalPreview(app, html, data) {
    const doNotShowJournalPreview =
      (app.document
        ? app.document.getFlag(PinCushion.MODULE_NAME, PinCushion.FLAGS.DO_NOT_SHOW_JOURNAL_PREVIEW)
        : app.object.getFlag(PinCushion.MODULE_NAME, PinCushion.FLAGS.DO_NOT_SHOW_JOURNAL_PREVIEW)) ?? false;

    const textGroup = html.find('[name=text]').closest('.form-group');
    textGroup.after(`
      <div class="form-group">
        <label for="flags.${PinCushion.MODULE_NAME}.${
      PinCushion.FLAGS.DO_NOT_SHOW_JOURNAL_PREVIEW
    }">${game.i18n.localize('PinCushion.DoNotshowJournalPreview')}</label>
        <div class="form-fields">
          <input type="checkbox" name="flags.${PinCushion.MODULE_NAME}.${
      PinCushion.FLAGS.DO_NOT_SHOW_JOURNAL_PREVIEW
    }" data-dtype="Boolean" ${doNotShowJournalPreview ? 'checked' : ''}>
        </div>
      </div>
    `);
  }

  /**
   * If the Note has a GM-NOTE on it, then display that as the tooltip instead of the normal text
   * @param {function} [wrapped] The wrapped function provided by libWrapper
   * @param {object}   [args]    The normal arguments to Note#drawTooltip
   * @returns {PIXI.Text}
   */
  static _addDrawTooltip(wrapped, ...args) {
    const hideLabel =
      (this.document
        ? this.document.getFlag(PinCushion.MODULE_NAME, PinCushion.FLAGS.HIDE_LABEL)
        : this.object.getFlag(PinCushion.MODULE_NAME, PinCushion.FLAGS.HIDE_LABEL)) ?? false;

    // Only override default if flag(PinCushion.MODULE_NAME,PinCushion.FLAGS.PIN_GM_TEXT) is set
    const newtext = this.document.getFlag(PinCushion.MODULE_NAME, PinCushion.FLAGS.PIN_GM_TEXT);
    if (!newtext || newtext.length === 0) {
      let result = wrapped(...args);
      if (hideLabel) {
        result.text = '';
      }
      return result;
    }

    // Set a different label to be used while we call the original Note.prototype._drawTooltip
    //
    // Note#text          = get text()  { return this.document.label; }
    // NoteDocument#label = get label() { return this.data.text || this.entry?.name || "Unknown"; }
    // but NoteDocument#data.text can be modified :-)
    //
    let saved_text = this.document.data.text;
    this.document.data.text = newtext;
    let result = wrapped(...args);
    this.document.data.text = saved_text;

    if (hideLabel) {
      result.text = '';
    }

    return result;
  }

  /**
   * Draw the map note Tooltip as a Text object
   * @returns {PIXI.Text}
   */
  static _addDrawTooltip2(wrapped, ...args) {
    const hideLabel =
      (this.document
        ? this.document.getFlag(PinCushion.MODULE_NAME, PinCushion.FLAGS.HIDE_LABEL)
        : this.object.getFlag(PinCushion.MODULE_NAME, PinCushion.FLAGS.HIDE_LABEL)) ?? false;

    let result = wrapped(...args);
    if (hideLabel) {
      result.text = '';
    }
    return result;
  }

  /**
   * Wraps the default Note#refresh to allow the visibility of scene Notes to be controlled by the reveal
   * state stored in the Note (overriding the default visibility which is based on link accessibility).
   * @param {function} [wrapped] The wrapper function provided by libWrapper
   * @param {Object}   [args]    The arguments for Note#refresh
   * @return [Note]    This Note
   */
  static _noteRefresh(wrapped, ...args) {
    let result = wrapped(...args);

    let textAlwaysVisible =
      this.document.getFlag(PinCushion.MODULE_NAME, PinCushion.FLAGS.TEXT_ALWAYS_VISIBLE) ?? false;
    // let textVisible = this._hover;
    if (textAlwaysVisible == true) {
      // Keep tooltip always visible
      // Though could make an option out of that too. Would be nicer
      // TODO it's seem we don't need this
      // this.position.set(this.data.x, this.data.y);
      // this.controlIcon.border.visible = this._hover;

      // textVisible = true;
      this.tooltip.visible = true;
    }
    // this.tooltip.visible = textVisible;
    //this.visible = this.entry?.testUserPermission(game.user, "LIMITED") ?? true;

    // Text is created bevor this point. So we can modify it here.
    let ratio = this.document.getFlag(PinCushion.MODULE_NAME, PinCushion.FLAGS.RATIO);
    if (ratio) {
      let text = this.children[1]; // 0 is the ControlIcon, 1 is the PreciseText
      text.x = (this.size * (ratio - 1)) / 2; // correct shifting for the new scale.
    }

    PinCushion.setNoteRevealed(this.data, undefined);

    const use_reveal = result.document.getFlag(PinCushion.MODULE_NAME, PinCushion.FLAGS.USE_PIN_REVEALED);
    if (use_reveal === undefined || !use_reveal) {
      return result;
    }
    const value = result.document.getFlag(PinCushion.MODULE_NAME, PinCushion.FLAGS.PIN_IS_REVEALED);
    // Use the revealed state as the visibility of the Note.
    // If the linked topic is not visible to the player then clicking will do nothing.
    if (value != undefined) {
      result.visible = value;
    }

    return result;
  }

  /**
   * Wraps the default Note#refresh to allow the visibility of scene Notes to be controlled by the reveal
   * state stored in the Note (overriding the default visibility which is based on link accessibility).
   * @param {function} [wrapped] The wrapper function provided by libWrapper
   * @param {Object}   [args]    The arguments for Note#refresh
   * @return [Note]    This Note
   */
  static _noteRefresh2(wrapped, ...args) {
    let result = wrapped(...args);

    let textAlwaysVisible =
      this.document.getFlag(PinCushion.MODULE_NAME, PinCushion.FLAGS.TEXT_ALWAYS_VISIBLE) ?? false;
    // let textVisible = this._hover;
    if (textAlwaysVisible == true) {
      // Keep tooltip always visible
      // Though could make an option out of that too. Would be nicer
      // TODO it's seem we don't need this
      // this.position.set(this.data.x, this.data.y);
      // this.controlIcon.border.visible = this._hover;

      // textVisible = true;
      this.tooltip.visible = true;
    }
    // this.tooltip.visible = textVisible;
    //this.visible = this.entry?.testUserPermission(game.user, "LIMITED") ?? true;

    // Text is created bevor this point. So we can modify it here.
    let ratio = this.document.getFlag(PinCushion.MODULE_NAME, PinCushion.FLAGS.RATIO);
    if (ratio) {
      let text = this.children[1]; // 0 is the ControlIcon, 1 is the PreciseText
      text.x = (this.size * (ratio - 1)) / 2; // correct shifting for the new scale.
    }
    return result;
  }

  /* -------------------------------- Listeners ------------------------------- */

  /**
   * Handles doubleclicks
   * @param {*} event
   */
  static _onDoubleClick(event) {
    if (canvas.activeLayer._hover) {
      return;
    }

    // Silently return when note creation permissions are missing
    if (!game.user.can('NOTE_CREATE')) return;

    // Warn user when notes can be created, but journal entries cannot
    if (!game.user.can('JOURNAL_CREATE')) {
      ui.notifications.warn(
        game.i18n.format('PinCushion.AllowPlayerNotes', {
          permission: game.i18n.localize('PERMISSION.JournalCreate'),
        }),
      );
      return;
    }

    const data = {
      clientX: event.data.global.x,
      clientY: event.data.global.y,
    };

    game.pinCushion._createDialog(data);
  }

  static _drawControlIconInternal(noteInternal) {
    // Wraps the default Note#_drawControlIcon so that we can override the stored noteInternal.data.iconTint based
    // on whether the link is accessible for the current player (or not). This is only done for links which
    // are using the "revealed" flag.
    const revealedNotes = game.settings.get(PinCushion.MODULE_NAME, 'revealedNotes');
    if (!game.user.isGM && revealedNotes) {
      const use_reveal = noteInternal.document.getFlag(PinCushion.MODULE_NAME, PinCushion.FLAGS.USE_PIN_REVEALED);
      if (use_reveal === undefined || !use_reveal) {
        // return wrapped(...args);
      } else {
        const value = noteInternal.document.getFlag(PinCushion.MODULE_NAME, PinCushion.FLAGS.USE_PIN_REVEALED);
        if (value != undefined) {
          const is_linked = noteInternal.entry?.testUserPermission(game.user, 'LIMITED');
          const colour = game.settings.get(
            PinCushion.MODULE_NAME,
            is_linked ? 'revealedNotesTintColorLink' : 'revealedNotesTintColorNotLink',
          );
          if (colour?.length > 0) {
            noteInternal.data.iconTint = colour;
          }
        }
      }
    }

    const enableBackgroundlessPins = game.settings.get(PinCushion.MODULE_NAME, 'enableBackgroundlessPins');
    if (enableBackgroundlessPins) {
      let tint = noteInternal.data.iconTint ? colorStringToHex(noteInternal.data.iconTint) : null;
      let iconData = { texture: noteInternal.data.icon, size: noteInternal.size, tint: tint };
      let icon;
      // this is note
      if (
        noteInternal.document &&
        noteInternal.document.getFlag(PinCushion.MODULE_NAME, PinCushion.FLAGS.HAS_BACKGROUND)
      ) {
        icon = new ControlIcon(iconData);
        // } else if (noteInternal.getFlag(PinCushion.MODULE_NAME, PinCushion.FLAGS.HAS_BACKGROUND)) { // compatibility 0.8.9
        //   icon = new ControlIcon(iconData);
      } else {
        icon = new BackgroundlessControlIcon(iconData);
      }
      if (noteInternal.document.getFlag(PinCushion.MODULE_NAME, PinCushion.FLAGS.RATIO) > 1) {
        if (noteInternal.document) {
          icon.scale.x = noteInternal.document.getFlag(PinCushion.MODULE_NAME, PinCushion.FLAGS.RATIO);
        }
        // else{
        //   icon.scale.x = noteInternal.getFlag(PinCushion.MODULE_NAME,  PinCushion.FLAGS.RATIO); // compatibility 0.8.9
        // }
        // TODO need to centre text
      }
      // PATCH MODULE autoIconFlags
      if (noteInternal.data?.flags?.autoIconFlags) {
        const flagsAutomaticJournalIconNumbers = {
          autoIcon: noteInternal.data?.flags.autoIconFlags.autoIcon,
          iconType: noteInternal.data?.flags.autoIconFlags.iconType,
          iconText: noteInternal.data?.flags.autoIconFlags.iconText,
          foreColor: noteInternal.data?.flags.autoIconFlags.foreColor,
          backColor: noteInternal.data?.flags.autoIconFlags.backColor,
          fontFamily: noteInternal.data?.flags.autoIconFlags.fontFamily,
        };
        if (flagsAutomaticJournalIconNumbers.fontFamily) {
          noteInternal.data.fontFamily = flagsAutomaticJournalIconNumbers.fontFamily;
        }
        //noteInternal.controlIcon?.bg?.fill = flagsAutomaticJournalIconNumbers.backColor;
      }
      icon.x -= noteInternal.size / 2;
      icon.y -= noteInternal.size / 2;
      return icon;
    } else {
      return undefined;
    }
  }

  /**
   * Handles draw control icon
   * @param {*} event
   */
  static _drawControlIcon(event) {
    const res = PinCushion._drawControlIconInternal(this);
    if (res == undefined) {
      // return wrapped(...args);
    } else {
      return res;
    }
  }

  /**
   * Handles draw control icon
   * @param {*} event
   */
  static _drawControlIcon2(wrapped, ...args) {
    const res = PinCushion._drawControlIconInternal(this);
    if (res == undefined) {
      return wrapped(...args);
    } else {
      return res;
    }
  }

  /**
   * Defines the icon to be drawn for players if enabled.
   */
  static _onPrepareNoteData(wrapped) {
    wrapped();

    // IF not GM and IF  = enabled then take flag path as note.data.icon
    if (!game.user.isGM) {
      if (this.document && this.document.getFlag(PinCushion.MODULE_NAME, PinCushion.FLAGS.PLAYER_ICON_STATE)) {
        this.data.icon = this.document.getFlag(PinCushion.MODULE_NAME, PinCushion.FLAGS.PLAYER_ICON_PATH);
      }
      // Foundry 0.8.9
      // else if(this.getFlag(PinCushion.MODULE_NAME,PinCushion.FLAGS.PLAYER_ICON_PATH)){
      //   this.data.icon = this.getFlag(PinCushion.MODULE_NAME,PinCushion.FLAGS.PLAYER_ICON_PATH);
      // }
    }
  }

  /**
   * Socket handler
   *
   * @param {object} message - The socket event's content
   * @param {string} message.action - The action the socket receiver should take
   * @param {Data} [message.data] - The data to be used for Document actions
   * @param {string} [message.id] - The ID used to handle promises
   * @param {string} userId - The ID of the user emitting the socket event
   * @returns {void}
   */
  _onSocket(message, userId) {
    const { action, data, id } = message;
    const isFirstGM = game.user === game.users.find((u) => u.isGM && u.active);

    // Handle resolving or rejecting promises for GM priviliged requests
    if (action === 'return') {
      const promise = game.pinCushion._requests[message.id];
      if (promise) {
        delete game.pinCushion._requests[message.id];
        if ('error' in message) promise.reject(message.error);
        promise.resolve(data);
      }
      return;
    }

    if (!isFirstGM) return;

    // Create a Journal Entry Folder
    if (action === 'createFolder') {
      const userName = game.users.get(userId).name;
      return Folder.create({ name: userName, type: 'JournalEntry', parent: null, sorting: 'a' })
        .then((response) => {
          game.socket.emit(
            `module.${PinCushion.MODULE_NAME}`,
            {
              action: 'return',
              data: response.data,
              id: id,
            },
            { recipients: [userId] },
          );
        })
        .catch((error) => {
          game.socket.emit(`module.${PinCushion.MODULE_NAME}`, {
            action: 'return',
            error: error,
            id: id,
          });
        });
    }
  }

  static _addJournalThumbnail(app, html, data) {
    if (
      (game.user.isGM && game.settings.get(PinCushion.MODULE_NAME, 'enableJournalThumbnailForGMs')) ||
      (!game.user.isGM && game.settings.get(PinCushion.MODULE_NAME, 'enableJournalThumbnailForPlayers'))
    ) {
      app.documents.forEach((j) => {
        if (!j.data.img) {
          return;
        }
        const htmlEntry = html.find(`.directory-item.document[data-document-id="${j.id}"]`);
        if (htmlEntry.length !== 1) {
          return;
        }
        htmlEntry.prepend(`<img class="pin-cushion-thumbnail sidebar-image journal-entry-image" src="${j.data.img}" title="${j.name}"
              alt='Journal Entry Thumbnail'>`);
      });
      // const lis = html.find("li.journal")?.length > 0
      //   ?  html.find("li.journal") // foundryvtt 0.8.9
      //   :  html.find('li.journalentry') // foundryvtt 9;
      //   ;
      // for (const li of lis) {
      //   const target = $(li);
      //   const id = target.data("entity-id")?.length > 0
      //     ? target.data("entity-id") // foundryvtt 0.8.9
      //     : target.data('document-id'); // foundryvtt 9
      //   const journalEntry = game.journal.get(id);

      //   if (journalEntry?.data?.img) {
      //     const thumbnail = $(
      //       "<img class='thumbnail' src='" + journalEntry.data.img + "' alt='Journal Entry Thumbnail'>"
      //     );
      //     target.append(thumbnail);
      //   }
      // }
    }
  }

  /**
   * Sets whether this Note is revealed (visible) to players; overriding the default FoundryVTT rules.
   * The iconTint will also be set on the Note based on whether there is a link that the player can access.
   * If this function is never called then the default FoundryVTT visibility rules will apply
   * @param [NoteData] [notedata] The NoteData whose visibility is to be set (can be used before the Note has been created)
   * @param {Boolean}  [visible]  pass in true if the Note should be revealed to players
   */
  static setNoteRevealed(notedata, visible) {
    const revealedNotes = game.settings.get(PinCushion.MODULE_NAME, 'revealedNotes');
    if (revealedNotes) {
      visible = getProperty(notedata, `flags.${PinCushion.MODULE_NAME}.${PinCushion.FLAGS.PIN_IS_REVEALED}`);
      if (visible) {
        const revealedNotesTintColorLink = game.settings.get(PinCushion.MODULE_NAME, 'revealedNotesTintColorLink');
        const revealedNotesTintColorNotLink = game.settings.get(
          PinCushion.MODULE_NAME,
          'revealedNotesTintColorNotLink',
        );
        const FLAG_IS_REVEALED = `flags.${PinCushion.MODULE_NAME}.${PinCushion.FLAGS.PIN_IS_REVEALED}`;
        const FLAG_USE_REVEALED = `flags.${PinCushion.MODULE_NAME}.${PinCushion.FLAGS.USE_PIN_REVEALED}`;
        // notedata might not exist as a Note, so setFlag is not available
        setProperty(notedata, FLAG_USE_REVEALED, true);
        setProperty(notedata, FLAG_IS_REVEALED, visible);
        // Default tint based on GM view
        let tint = game.settings.get(
          PinCushion.MODULE_NAME,
          notedata.entryId ? 'revealedNotesTintColorLink' : 'revealedNotesTintColorNotLink',
        );
        if (tint?.length > 0) notedata.iconTint = tint;
      }
    }
  }

  /**
   * Adds a GM-only string to be displayed on the Note *instead of* the normal note text for the GM,
   * players will see the normal non-GM text.
   * @param {NoteData} [notedata]  The NoteData to which GM-only text is to be added
   * @param {String}   [text]      The text to be stored as the GM-only text for this note
   */
  static setNoteGMtext(notedata, text) {
    // notedata might not exist as a Note, so setFlag is not available
    setProperty(notedata, `flags.${PinCushion.MODULE_NAME}.${PinCushion.FLAGS.PIN_GM_TEXT}`, text);
  }

  /**
   * Helper function to register settings
   */
  static _registerSettings() {
    registerSettings();
  }
}
