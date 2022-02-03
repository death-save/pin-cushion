

/**
 * A class for managing additional Map Pin functionality
 * @author Evan Clarke (errational#2007)
 */
class PinCushion {
    constructor() {
        // Storage for requests sent over a socket, pending GM execution
        this._requests = {};
    }

    /* -------------------------------- Constants ------------------------------- */

    static get MODULE_NAME() {
        return "pin-cushion";
    }

    static get MODULE_TITLE() {
        return "Pin Cushion";
    }

    static get PATH() {
        return "modules/pin-cushion";
    }

    static get DIALOG() {
        const defaultPermission = game.settings.get(PinCushion.MODULE_NAME, "defaultJournalPermission");
        const defaultFolder = game.settings.get(PinCushion.MODULE_NAME, "defaultJournalFolder");
        const settingSpecificFolder = game.settings.get(PinCushion.MODULE_NAME, "specificFolder");
        const folders = game.journal.directory.folders
          .sort((a, b) => a.name.localeCompare(b.name))
          .filter((folder) => folder.displayed)
          .map((folder) => `<option value="${folder.id}">${folder.name}</option>`).join("\n");
        return {
            content: `
              <div class="form-group">
                <p class="notes">${game.i18n.localize("PinCushion.Name")}</p>
                </label>
                <input name="name" type="text">
                <p class="notes">${game.i18n.localize("PinCushion.DefaultPermission")}</p>
                </label>
                <select id="cushion-permission" style="width: 100%;">
                  <option value="0" ${defaultPermission == "0" ? "selected" : ""}>${game.i18n.localize("PERMISSION.NONE")}</option>
                  <option value="1" ${defaultPermission == "1" ? "selected" : ""}>${game.i18n.localize("PERMISSION.LIMITED")}</option>
                  <option value="2" ${defaultPermission == "2" ? "selected" : ""}>${game.i18n.localize("PERMISSION.OBSERVER")}</option>
                  <option value="3" ${defaultPermission == "3" ? "selected" : ""}>${game.i18n.localize("PERMISSION.OWNER")}</option>
                </select>
                <p class="notes">${game.i18n.localize("PinCushion.Folder")}</p>
                </label>
                <select id="cushion-folder" style="width: 100%;">
                  <option value="none" ${defaultFolder == "none" ? "selected" : ""}>${game.i18n.localize("PinCushion.None")}</option>
                  ${game.user.isGM ? `` : `<option value="perUser" ${defaultFolder == "perUser" ? "selected" : ""}>${game.i18n.localize("PinCushion.PerUser")}</option>`}
                  <option value="specificFolder" ${defaultFolder == "specificFolder" ? "selected" : ""}>${game.i18n.localize("PinCushion.PerSpecificFolder")}</option>
                  <option disabled>──${game.i18n.localize("PinCushion.ExistingFolders")}──</option>
                  ${folders}
                </select>
              </div>
              </br>
              `,
            title: "Create a Map Pin"
        }
    }

    static get NOTESLAYER() {
        return "NotesLayer";
    }

    static get FONT_SIZE() {
        return 16;
    }

    static get FLAGS() {
      return {
        USE_PIN_REVEALED : "usePinRevealed",
        PIN_IS_REVEALED  : "pinIsRevealed",
        PIN_GM_TEXT : "gmNote",
        HAS_BACKGROUND: "hasBackground",
        RATIO: "ratio",
        TEXT_ALWAYS_VISIBLE: "textAlwaysVisible",
        PLAYER_ICON_STATE : "PlayerIconState",
        PLAYER_ICON_PATH : "PlayerIconPath",
        CUSHION_ICON : "cushionIcon",
        SHOW_IMAGE : "showImage",
        HIDE_LABEL : "hideLabel"
      }
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
                    label: "Save",
                    icon: `<i class="fas fa-check"></i>`,
                    callback: (html) => {
                        return this.createNoteFromCanvas(html, data);
                    }
                },
                cancel: {
                    label: "Cancel",
                    icon: `<i class="fas fa-times"></i>`,
                    callback: (e) => {
                        // Maybe do something in the future
                    }
                }
            },
            default: "save"
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
            ui.notifications.warn(game.i18n.localize("PinCushion.MissingPinName"));
            return;
        }
        // Permissions the Journal Entry will be created with
        const permission = {
            [game.userId]: CONST.ENTITY_PERMISSIONS.OWNER,
            default: parseInt($("#cushion-permission").val())
        }

        // Get folder ID for Journal Entry
        let folder;
        const selectedFolder = $("#cushion-folder").val();
        if (selectedFolder === "none") {
          folder = undefined;
        }
        else if (selectedFolder === "perUser") {
            folder = PinCushion.getFolder(game.user.name, selectedFolder);
            if (!game.user.isGM && folder === undefined) {
                // Request folder creation when perUser is set and the entry is created by a user
                // Since only the ID is required, instantiating a Folder from the data is not necessary
                folder = (await PinCushion.requestEvent({ action: "createFolder" }))?._id;
            }
        }
        else if(selectedFolder === "specificFolder"){
          const settingSpecificFolder = game.settings.get(PinCushion.MODULE_NAME, "specificFolder");
          folder = PinCushion.getFolder(game.user.name, selectedFolder, settingSpecificFolder);
        }
        else {
          folder = selectedFolder; // Folder is already given as ID
        }
        const entry = await JournalEntry.create({name: `${input[0].value}`, permission, ...(folder && {folder})});

        if (!entry) {
            return;
        }

        // Manually add fields required by Foundry's drop handling
        const entryData = entry.data.toJSON();
        entryData.id = entry.id;
        entryData.type = "JournalEntry";

        if (canvas.activeLayer.name !== PinCushion.NOTESLAYER) {
            await canvas.notes.activate();
        }

        await canvas.activeLayer._onDropData(eventData, entryData);
    }

    /**
     * Request an action to be executed with GM privileges.
     *
     * @static
     * @param {object} message - The object that will get emitted via socket
     * @param {string} message.action - The specific action to execute
     * @returns {Promise} The promise of the action which will be resolved after execution by the GM
     */
    static requestEvent(message) {
        // A request has to define what action should be executed by the GM
        if (!"action" in message) return;

        const promise = new Promise((resolve, reject) => {
            const id = `${game.user.id}_${Date.now()}_${randomID()}`;
            message.id = id;
            game.pinCushion._requests[id] = {resolve, reject};
            game.socket.emit(`module.${PinCushion.MODULE_NAME}`, message);
            setTimeout(() => {
                delete game.pinCushion._requests[id];
                reject(new Error (`${PinCushion.MODULE_TITLE} | Call to ${message.action} timed out`));
            }, 5000);
        });
        return promise;
    }

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
            case "none":
                return undefined;
            // Target folder should match the user's name
            case "perUser":
                return game.journal.directory.folders.find((f) => f.name === name)?.id ?? undefined;
            case "specificFolder":
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
        const setting = game.settings.get(PinCushion.MODULE_NAME, "defaultJournalFolder");
        const missingFolders = game.users
            .filter((u) => !u.isGM && PinCushion.getFolder(u.name, setting) === undefined)
            .map((user) => ({
                name: user.name,
                type: "JournalEntry",
                parent: null,
                sorting: "a",
            }));
        if (missingFolders.length) {
            // Ask for folder creation confirmation in a dialog
            const createFolders = await new Promise((resolve, reject) => {
                new Dialog({
                    title: game.i18n.localize("PinCushion.CreateMissingFoldersT"),
                    content: game.i18n.localize("PinCushion.CreateMissingFoldersC"),
                    buttons: {
                        yes: {
                            label: `<i class="fas fa-check"></i> ${game.i18n.localize("Yes")}`,
                            callback: () => resolve(true),
                        },
                        no: {
                            label: `<i class="fas fa-times"></i> ${game.i18n.localize("No")}`,
                            callback: () => reject(),
                        },
                    },
                    default: "yes",
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
        const filePickerHtml =
        `<input type="text" name="icon" title="Icon Path" class="icon-path" value="${data.data.icon}" placeholder="/icons/example.svg" data-dtype="String">
        <button type="button" name="file-picker" class="file-picker" data-type="image" data-target="icon" title="Browse Files" tabindex="-1">
        <i class="fas fa-file-import fa-fw"></i>
        </button>`

        const iconSelector = html.find("select[name='icon']");

        iconSelector.replaceWith(filePickerHtml);

        // Detect and activate file-picker buttons
        //html.find("button.file-picker").on("click", app._activateFilePicker.bind(app));
        html.find("button.file-picker").each((i, button) => (button.onclick = app._activateFilePicker.bind(app)));
    }

  /**
   * Add background field
   * @param {*} app
   * @param {*} html
   * @param {*} data
   */
  static _addBackgroundField(app, html, data) {
    const hasBackground = (app.document
      ? app.document.getFlag(PinCushion.MODULE_NAME, PinCushion.FLAGS.HAS_BACKGROUND)
      : app.object.getFlag(PinCushion.MODULE_NAME, PinCushion.FLAGS.HAS_BACKGROUND)) ?? 0;
    const iconTintGroup = html.find("[name=iconTint]").closest(".form-group");
    const ratio = (app.document
      ? app.document.getFlag(PinCushion.MODULE_NAME, PinCushion.FLAGS.RATIO)
      : app.object.getFlag(PinCushion.MODULE_NAME, PinCushion.FLAGS.RATIO)) ?? 1;
    const iconSizeGroup = html.find("[name=iconSize]").closest(".form-group");
    const textAlwaysVisible = (app.document
      ? app.document.getFlag(PinCushion.MODULE_NAME, PinCushion.FLAGS.TEXT_ALWAYS_VISIBLE)
      : app.object.getFlag(PinCushion.MODULE_NAME, PinCushion.FLAGS.TEXT_ALWAYS_VISIBLE)) ?? false;
    const textAnchorGroup = html.find("[name=textAnchor]").closest(".form-group");

    iconTintGroup.after(`
            <div class="form-group">
                <label for="flags.${PinCushion.MODULE_NAME}.${PinCushion.FLAGS.HAS_BACKGROUND}">${game.i18n.localize("PinCushion.HasBackground")}</label>
                <input type="checkbox" name="flags.${PinCushion.MODULE_NAME}.${PinCushion.FLAGS.HAS_BACKGROUND}" data-dtype="Boolean" ${
                  hasBackground ? "checked" : ""
                }>
            </div>
        `);

    iconSizeGroup.after(`
      <div class="form-group">
          <label for="flags.${PinCushion.MODULE_NAME}.${PinCushion.FLAGS.RATIO}">${game.i18n.localize("PinCushion.HasBackgroundRatio")}</label>
          <input type="text" name="flags.${PinCushion.MODULE_NAME}.${PinCushion.FLAGS.RATIO}" data-dtype="Number" value="${ratio}">
      </div>
    `);

    textAnchorGroup.after(`
      <div class="form-group">
        <label for="flags.${PinCushion.MODULE_NAME}.${PinCushion.FLAGS.TEXT_ALWAYS_VISIBLE}">${game.i18n.localize("PinCushion.TextAlwaysVisible")}</label>
        <div class="form-fields">
          <input type="checkbox" name="flags.${PinCushion.MODULE_NAME}.${PinCushion.FLAGS.TEXT_ALWAYS_VISIBLE}" data-dtype="Boolean" ${textAlwaysVisible ? "checked" : ""}>
        </div>
      </div>
    `);
    app.setPosition({ height: "auto" });
  }

  /**
   * Add show image field
   * @param {*} app
   * @param {*} html
   * @param {*} data
   */
    static _addShowImageField(app, html, data) {
      const showImage = app.object.getFlag(PinCushion.MODULE_NAME, PinCushion.FLAGS.SHOW_IMAGE) ?? false;
      const iconTintGroup = html.find("[name=iconTint]").closest(".form-group");
      iconTintGroup.after(`
              <div class="form-group">
                  <label for="flags.${PinCushion.MODULE_NAME}.${PinCushion.FLAGS.SHOW_IMAGE}">${game.i18n.localize("PinCushion.ShowImage")}</label>
                  <input type="checkbox" name="flags.${PinCushion.MODULE_NAME}.${PinCushion.FLAGS.SHOW_IMAGE}" data-dtype="Boolean" ${
                    showImage ? "checked" : ""
                  }>
              </div>
          `);
      app.setPosition({ height: "auto" });
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
    const defaultState = game.settings.get(PinCushion.MODULE_NAME, "playerIconAutoOverride");
    const defaultPath = game.settings.get(PinCushion.MODULE_NAME, "playerIconPathDefault");

    const state = getProperty(data, `data.flags.${PinCushion.MODULE_NAME}.${PinCushion.FLAGS.PLAYER_ICON_STATE}`) ?? defaultState;
    const path = getProperty(data, `data.flags.${PinCushion.MODULE_NAME}.${PinCushion.FLAGS.PLAYER_ICON_PATH}`) ?? defaultPath;

    /* Set HTML to be added to the note-config */
    const playerIconHtml = `<hr>
        <!-- Button to Enable overrides -->
        <div class="form-group">
        <label>${game.i18n.localize("PinCushion.UsePlayerIcon")}</label>
        <div class="form-fields">
        <input type="checkbox" name="flags.${PinCushion.MODULE_NAME}.${PinCushion.FLAGS.PLAYER_ICON_STATE}" data-dtype="Boolean" ${
      state ? "checked" : ``
    } />
        </div>
        <p class="notes">${game.i18n.localize("PinCushion.PlayerIconHint")}</p>
        </div>

        <!-- Player Icon -->
        <div class="form-group">
        <label>${game.i18n.localize("PinCushion.PlayerIconPath")}</label>
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

  static _addNoteGM(app, html, data){
    let gmNoteFlagRef = `flags.${PinCushion.MODULE_NAME}.${PinCushion.FLAGS.PIN_GM_TEXT}`;
    // Input for GM Label
    let gmtext = data.document.getFlag(PinCushion.MODULE_NAME, PinCushion.FLAGS.PIN_GM_TEXT);
    if (!gmtext) gmtext = "";
    let gm_text = $(`<div class='form-group'><label>GM Label</label><div class='form-fields'><textarea name='${gmNoteFlagRef}'>${gmtext}</textarea></div></div>`)
    html.find("input[name='text']").parent().parent().after(gm_text);

    // Multiline input for Text Label
    let initial_text = data.data.text ?? data.entry.name;
    let label = $(`<div class='form-group'><label>Player Label</label><div class='form-fields'><textarea name='text' placeholder='${data.entry.name}'>${initial_text}</textarea></div></div>`)
    html.find("input[name='text']").parent().parent().after(label);

    // Hide the old text label input field
    html.find("input[name='text']").parent().parent().remove();

    //let reveal_icon = $(`<div class='form-group'><label>Icon follows Reveal</label><div class='form-fields'><input type='checkbox' name='useRevealIcon'></div></div>`)
    //html.find("select[name='icon']").parent().parent().after(reveal_icon);

    // Force a recalculation of the height
    if (!app._minimized) {
      let pos = app.position;
      pos.height = 'auto'
      app.setPosition(pos);
    }
  }

  static _addNoteTintColorLink(app, html, data){
    const FLAG_IS_REVEALED  = `flags.${PinCushion.MODULE_NAME}.${PinCushion.FLAGS.PIN_IS_REVEALED}`;
    const FLAG_USE_REVEALED = `flags.${PinCushion.MODULE_NAME}.${PinCushion.FLAGS.USE_PIN_REVEALED}`;

    // Check box to control use of REVEALED state
    let checked = (data.document.getFlag(PinCushion.MODULE_NAME, PinCushion.FLAGS.PIN_IS_REVEALED) ?? true) ? "checked" : "";
    let revealed_control = $(`<div class='form-group'><label>${game.i18n.localize('PinCushion.RevealedToPlayer')}</label><div class='form-fields'><input type='checkbox' name='${FLAG_IS_REVEALED}' ${checked}></div></div>`)
    html.find("select[name='entryId']").parent().parent().after(revealed_control);

    // Check box for REVEALED state
    let use_reveal = (data.document.getFlag(PinCushion.MODULE_NAME, PinCushion.FLAGS.USE_PIN_REVEALED) ?? false) ? "checked" : "";
    let mode_control = $(`<div class='form-group'><label>${game.i18n.localize('PinCushion.UseRevealState')}</label><div class='form-fields'><input type='checkbox' name='${FLAG_USE_REVEALED}' ${use_reveal}></div></div>`)
    html.find("select[name='entryId']").parent().parent().after(mode_control);

    // Force a recalculation of the height
    if (!app._minimized) {
      let pos = app.position;
      pos.height = 'auto'
      app.setPosition(pos);
    }
  }

  static _addHideLabel(app, html, data){
    const hideLabel = (app.document
      ? app.document.getFlag(PinCushion.MODULE_NAME, PinCushion.FLAGS.HIDE_LABEL)
      : app.object.getFlag(PinCushion.MODULE_NAME, PinCushion.FLAGS.HIDE_LABEL)) ?? false;
    const textGroup = html.find("[name=text]").closest(".form-group");
    textGroup.after(`
      <div class="form-group">
        <label for="flags.${PinCushion.MODULE_NAME}.${PinCushion.FLAGS.HIDE_LABEL}">${game.i18n.localize("PinCushion.HideLabel")}</label>
        <div class="form-fields">
          <input type="checkbox" name="flags.${PinCushion.MODULE_NAME}.${PinCushion.FLAGS.HIDE_LABEL}" data-dtype="Boolean" ${hideLabel ? "checked" : ""}>
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

    const hideLabel = (this.document
      ? this.document.getFlag(PinCushion.MODULE_NAME, PinCushion.FLAGS.HIDE_LABEL)
      : this.object.getFlag(PinCushion.MODULE_NAME, PinCushion.FLAGS.HIDE_LABEL)) ?? false;

    // Only override default if flag(PinCushion.MODULE_NAME,PinCushion.FLAGS.PIN_GM_TEXT) is set
    const newtext = this.document.getFlag(PinCushion.MODULE_NAME, PinCushion.FLAGS.PIN_GM_TEXT);
    if (!newtext || newtext.length===0){
      let result = wrapped(...args);
      if ( hideLabel ){
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

    if ( hideLabel ){
      result.text = '';
    }

    return result;
  }

  /**
 * Draw the map note Tooltip as a Text object
 * @returns {PIXI.Text}
 */
  static _addDrawTooltip2(wrapped, ...args) {
    const hideLabel = (this.document
      ? this.document.getFlag(PinCushion.MODULE_NAME, PinCushion.FLAGS.HIDE_LABEL)
      : this.object.getFlag(PinCushion.MODULE_NAME, PinCushion.FLAGS.HIDE_LABEL)) ?? false;

    let result = wrapped(...args);
    if ( hideLabel ){
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

    setNoteRevealed(this.data, undefined);

    const use_reveal = result.document.getFlag(PinCushion.MODULE_NAME, PinCushion.FLAGS.USE_PIN_REVEALED);
    if (use_reveal === undefined || !use_reveal) return result;

    const value = result.document.getFlag(PinCushion.MODULE_NAME, PinCushion.FLAGS.PIN_IS_REVEALED);
    // Use the revealed state as the visibility of the Note.
    // If the linked topic is not visible to the player then clicking will do nothing.
    if (value != undefined) {
      result.visible  = value;
    }

    // Keep tooltip always visible
	  // Though could make an option out of that too. Would be nicer
    this.position.set(this.data.x, this.data.y);
		this.controlIcon.border.visible = this._hover;
    // TODO Something seem not work...
    let textAlwaysVisible = this.document.getFlag(PinCushion.MODULE_NAME, PinCushion.FLAGS.TEXT_ALWAYS_VISIBLE) ?? false;
    let textVisible = true;
    if (textAlwaysVisible == false){
      textVisible = this._hover;
    }
    this.tooltip.visible = textVisible;
		this.visible = this.entry?.testUserPermission(game.user, "LIMITED") ?? true;

    // Text is created bevor this point. So we can modify it here.
    let ratio = this.document.getFlag(PinCushion.MODULE_NAME, PinCushion.FLAGS.RATIO);
    let text = this.children[1]; // 0 is the ControlIcon, 1 is the PreciseText
    text.x = (this.size * (ratio - 1)) / 2; // correct shifting for the new scale.

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
        if (!game.user.can("NOTE_CREATE")) return;

        // Warn user when notes can be created, but journal entries cannot
        if (!game.user.can("JOURNAL_CREATE")) {
            ui.notifications.warn(
                game.i18n.format("PinCushion.AllowPlayerNotes", {
                    permission: game.i18n.localize("PERMISSION.JournalCreate"),
                })
            );
            return;
        }

        const data = {
            clientX: event.data.global.x,
            clientY: event.data.global.y
        }

        game.pinCushion._createDialog(data);
    }

    static _drawControlIconInternal(noteInternal){
      // Wraps the default Note#_drawControlIcon so that we can override the stored noteInternal.data.iconTint based
      // on whether the link is accessible for the current player (or not). This is only done for links which
      // are using the "revealed" flag.
      const revealedNotes = game.settings.get(PinCushion.MODULE_NAME, "revealedNotes");
      if(!game.user.isGM && revealedNotes){
        const use_reveal = noteInternal.document.getFlag(PinCushion.MODULE_NAME, PinCushion.FLAGS.USE_PIN_REVEALED);
        if (use_reveal === undefined || !use_reveal){
          // return wrapped(...args);
        }else{
          const value = noteInternal.document.getFlag(PinCushion.MODULE_NAME, PinCushion.FLAGS.USE_PIN_REVEALED);
          if (value != undefined) {
            const is_linked = noteInternal.entry?.testUserPermission(game.user, "LIMITED");
            const colour = game.settings.get(PinCushion.MODULE_NAME, is_linked ? "revealedNotesTintColorLink" : "revealedNotesTintColorNotLink");
            if (colour?.length > 0){
              noteInternal.data.iconTint = colour;
            }
          }
        }
      }

      const enableBackgroundlessPins = game.settings.get(PinCushion.MODULE_NAME, "enableBackgroundlessPins");
      if (enableBackgroundlessPins) {
        let tint = noteInternal.data.iconTint ? colorStringToHex(noteInternal.data.iconTint) : null;
        let iconData = { texture: noteInternal.data.icon, size: noteInternal.size, tint: tint };
        let icon;
        // this is note
        if(noteInternal.document && noteInternal.document.getFlag(PinCushion.MODULE_NAME, PinCushion.FLAGS.HAS_BACKGROUND)){
          icon = new ControlIcon(iconData);
        // } else if (noteInternal.getFlag(PinCushion.MODULE_NAME, PinCushion.FLAGS.HAS_BACKGROUND)) { // compatibility 0.8.9
        //   icon = new ControlIcon(iconData);
        } else {
          icon = new BackgroundlessControlIcon(iconData);
        }
        if(noteInternal.document.getFlag(PinCushion.MODULE_NAME,  PinCushion.FLAGS.RATIO) > 1){
          if(noteInternal.document){
            icon.scale.x = noteInternal.document.getFlag(PinCushion.MODULE_NAME,  PinCushion.FLAGS.RATIO);
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
              fontFamily: noteInternal.data?.flags.autoIconFlags.fontFamily
          }
          if(flagsAutomaticJournalIconNumbers.fontFamily){
            noteInternal.data.fontFamily = flagsAutomaticJournalIconNumbers.fontFamily;
          }
          //noteInternal.controlIcon?.bg?.fill = flagsAutomaticJournalIconNumbers.backColor;
        }
        icon.x -= noteInternal.size / 2;
        icon.y -= noteInternal.size / 2;
        return icon;
      }else{
        return undefined;
      }
    }

  /**
   * Handles draw control icon
   * @param {*} event
   */
  static _drawControlIcon(event) {

    const res = PinCushion._drawControlIconInternal(this);
    if(res == undefined){
      // return wrapped(...args);
    }else{
      return res;
    }
  }

/**
   * Handles draw control icon
   * @param {*} event
   */
  static _drawControlIcon2(wrapped, ...args) {

    const res = PinCushion._drawControlIconInternal(this);
    if(res == undefined){
      return wrapped(...args);
    }else{
      return res;
    }
  }

  /**
   * Defines the icon to be drawn for players if enabled.
   */
  static _onPrepareNoteData(wrapped) {
    wrapped();

    // IF not GM and IF  = enabled then take flag path as note.data.icon
    if (!game.user.isGM){
      if(this.document && this.document.getFlag(PinCushion.MODULE_NAME,PinCushion.FLAGS.PLAYER_ICON_STATE)){
        this.data.icon = this.document.getFlag(PinCushion.MODULE_NAME,PinCushion.FLAGS.PLAYER_ICON_PATH);
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
        const {action, data, id} = message;
        const isFirstGM = game.user === game.users.find((u) => u.isGM && u.active)

        // Handle resolving or rejecting promises for GM priviliged requests
        if (action === "return") {
            const promise = game.pinCushion._requests[message.id];
            if (promise) {
                delete game.pinCushion._requests[message.id];
                if ("error" in message) promise.reject(message.error);
                promise.resolve(data);
            }
            return;
        }

        if (!isFirstGM) return;

        // Create a Journal Entry Folder
        if (action === "createFolder") {
            const userName = game.users.get(userId).name;
            return Folder.create({ name: userName, type: "JournalEntry", parent: null, sorting: "a" })
                .then((response) => {
                    game.socket.emit(`module.${PinCushion.MODULE_NAME}`, {
                        action: "return",
                        data: response.data,
                        id: id,
                    },
                    {recipients: [userId]});
                })
                .catch((error) => {
                    game.socket.emit(`module.${PinCushion.MODULE_NAME}`, {
                        action: "return",
                        error: error,
                        id: id,
                    });
                });
        }
    }

  static _addJournalThumbnail(app, html, data) {
    const lis = html.find("li.journal")?.length > 0
      ?  html.find("li.journal") // foundryvtt 0.8.9
      :  html.find('li.journalentry') // foundryvtt 9;
      ;
    for (const li of lis) {
      const target = $(li);
      const id = target.data("entity-id")?.length > 0
        ? target.data("entity-id") // foundryvtt 0.8.9
        : target.data('document-id'); // foundryvtt 9
      const journalEntry = game.journal.get(id);

      if (journalEntry?.data?.img) {
        const thumbnail = $(
          "<img class='thumbnail' src='" + journalEntry.data.img + "' alt='Journal Entry Thumbnail'>"
        );
        target.append(thumbnail);
      }
    }
  }

    /**
    * Helper function to register settings
    */
    static _registerSettings() {
        // game.settings.registerMenu(PinCushion.MODULE_NAME, "aboutApp", {
        //     name: game.i18n.localize("PinCushion.SETTINGS.AboutAppN"),
        //     label: game.i18n.localize("PinCushion.SETTINGS.AboutAppN"),
        //     hint: game.i18n.localize("PinCushion.SETTINGS.AboutAppH"),
        //     icon: "fas fa-question",
        //     type: PinCushionAboutApp,
        //     restricted: false
        // });

        game.settings.register(PinCushion.MODULE_NAME, "showJournalPreview", {
            name: game.i18n.localize("PinCushion.SETTINGS.ShowJournalPreviewN"),
            hint: game.i18n.localize("PinCushion.SETTINGS.ShowJournalPreviewH"),
            scope: "client",
            type: Boolean,
            default: false,
            config: true,
            onChange: (s) => {
                if (!s) {
                    delete canvas.hud.pinCushion;
                }

                canvas.hud.render();
            }
        });

        game.settings.register(PinCushion.MODULE_NAME, "previewType", {
            name: game.i18n.localize("PinCushion.SETTINGS.PreviewTypeN"),
            hint: game.i18n.localize("PinCushion.SETTINGS.PreviewTypeH"),
            scope: "client",
            type: String,
            choices: {
                html: "HTML",
                text: "Text Snippet"
            },
            default: "html",
            config: true,
            onChange: (s) => {}
        });

        game.settings.register(PinCushion.MODULE_NAME, "previewMaxLength", {
            name: game.i18n.localize("PinCushion.SETTINGS.PreviewMaxLengthN"),
            hint: game.i18n.localize("PinCushion.SETTINGS.PreviewMaxLengthH"),
            scope: "client",
            type: Number,
            default: 500,
            config: true,
            onChange: (s) => {}
        });

        game.settings.register(PinCushion.MODULE_NAME, "previewDelay", {
            name: game.i18n.localize("PinCushion.SETTINGS.PreviewDelayN"),
            hint: game.i18n.localize("PinCushion.SETTINGS.PreviewDelayH"),
            scope: "client",
            type: Number,
            default: 500,
            config: true,
            onChange: (s) => {}
        });

        game.settings.register(PinCushion.MODULE_NAME, "defaultJournalPermission", {
            name: game.i18n.localize("PinCushion.SETTINGS.DefaultJournalPermissionN"),
            hint: game.i18n.localize("PinCushion.SETTINGS.DefaultJournalPermissionH"),
            scope: "world",
            type: Number,
            choices: Object.entries(CONST.ENTITY_PERMISSIONS).reduce((acc, [perm, key]) => {
                acc[key] = game.i18n.localize(`PERMISSION.${perm}`);
                return acc;
            }, {}),
            default: 0,
            config: true,
            onChange: (s) => {}
        });

        game.settings.register(PinCushion.MODULE_NAME, "defaultJournalFolder", {
            name: game.i18n.localize("PinCushion.SETTINGS.DefaultJournalFolderN"),
            hint: game.i18n.localize("PinCushion.SETTINGS.DefaultJournalFolderH"),
            scope: "world",
            type: String,
            choices: {
                none: game.i18n.localize("PinCushion.None"),
                perUser: game.i18n.localize("PinCushion.PerUser"),
                specificFolder: game.i18n.localize("PinCushion.PerSpecificFolder")
            },
            default: "none",
            config: true,
            onChange: (s) => {
                // Only run check for folder creation for the main GM
                if (s === "perUser" && game.user === game.users.find((u) => u.isGM && u.active)) {
                    PinCushion._createFolders();
                }
            }
        });

        game.settings.register(PinCushion.MODULE_NAME, "specificFolder", {
          name: game.i18n.localize("PinCushion.SETTINGS.SpecificFolderN"),
          hint: game.i18n.localize("PinCushion.SETTINGS.SpecificFolderH"),
          scope: "world",
          type: String,
          choices: () => {
            const folders = game.journal.directory.folders
              .sort((a, b) => a.name.localeCompare(b.name));
            const arr = [];
            return Object.entries(folders).reduce((folder, [k, v]) => {
                folder[k] = v.name;
                return folder;
            }, {});
          },
          default: 0,
          config: true,
          onChange: (s) => {}
        });

       game.settings.register(PinCushion.MODULE_NAME, "enableBackgroundlessPins", {
            name: game.i18n.localize("PinCushion.SETTINGS.EnableBackgroundlessPinsN"),
            hint: game.i18n.localize("PinCushion.SETTINGS.EnableBackgroundlessPinsH"),
            scope: "world",
            type: Boolean,
            default: false,
            config: true,
      });

       game.settings.register(PinCushion.MODULE_NAME, "showJournalImageByDefault", {
            name: game.i18n.localize("PinCushion.SETTINGS.ShowJournalImageByDefaultN"),
            hint: game.i18n.localize("PinCushion.SETTINGS.ShowJournalImageByDefaultH"),
            scope: "world",
            type: Boolean,
            default: true,
            config: true,
       });

       game.settings.register(PinCushion.MODULE_NAME, "playerIconAutoOverride", {
            name: game.i18n.localize("PinCushion.SETTINGS.PlayerIconAutoOverrideN"),
            hint: game.i18n.localize("PinCushion.SETTINGS.PlayerIconAutoOverrideH"),
            scope: "world",
            config: true,
            default: false,
            type: Boolean,
       });

       game.settings.register(PinCushion.MODULE_NAME, "playerIconPathDefault", {
            name: game.i18n.localize("PinCushion.SETTINGS.PlayerIconPathDefaultN"),
            hint: game.i18n.localize("PinCushion.SETTINGS.PlayerIconPathDefaultH"),
            scope: "world",
            config: true,
            default: "icons/svg/book.svg",
            type: String,
            filePicker: true,
       });

      game.settings.register(PinCushion.MODULE_NAME, "noteGM", {
        name: game.i18n.localize("PinCushion.SETTINGS.noteGMN"),
        hint: game.i18n.localize("PinCushion.SETTINGS.noteGMH"),
        scope: "world",
        config: true,
        default: false,
        type: Boolean,
      });

      game.settings.register(PinCushion.MODULE_NAME, "revealedNotes", {
        name: game.i18n.localize("PinCushion.SETTINGS.revealedNotesN"),
        hint: game.i18n.localize("PinCushion.SETTINGS.revealedNotesH"),
        scope: "world",
        config: true,
        default: false,
        type: Boolean,
      });

      game.settings.register(PinCushion.MODULE_NAME, 'revealedNotesTintColorLink', {
        name: game.i18n.localize("PinCushion.SETTINGS.revealedNotesTintColorLinkN"),
        hint: game.i18n.localize("PinCushion.SETTINGS.revealedNotesTintColorLinkH"),
        scope: "world",
        type:  String,
        default: '#7CFC00',
        config: true,
        onChange: () => {
          if (canvas?.ready) {
            canvas.notes.placeables.forEach(note => note.draw());
            //for (let note of canvas.notes.objects) note.draw();
          }
        }
      });

      game.settings.register(PinCushion.MODULE_NAME, 'revealedNotesTintColorNotLink', {
        name: game.i18n.localize("PinCushion.SETTINGS.revealedNotesTintColorNotLinkN"),
        hint: game.i18n.localize("PinCushion.SETTINGS.revealedNotesTintColorNotLinkH"),
        scope: "world",
        type:  String,
        default: '#c000c0',
        config: true,
        onChange: () => {
          if (canvas?.ready) {
            canvas.notes.placeables.forEach(note => note.draw());
            //for (let note of canvas.notes.objects) note.draw();
          }
        }
      });

    }
}

/**
 * @class PinCushionHUD
 *
 * A HUD extension that shows the Note preview
 */
class PinCushionHUD extends BasePlaceableHUD {
    constructor(note, options) {
        super(note, options);
        this.data = note;
    }

    /**
     * Retrieve and override default options for this application
     */
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            id: "pin-cushion-hud",
            classes: [...super.defaultOptions.classes, "pin-cushion-hud"],
            width: 400,
            height: 200,
            minimizable: false,
            resizable: false,
            template: "modules/pin-cushion/templates/journal-preview.html"
        });
    }

    /**
     * Get data for template
     */
    getData() {
        const data = super.getData();
        const entry = this.object.entry;
        if (!entry)
        {
            // Do nothing b/c this doesn't have an entry
            return;
        }
        // TODO The getFlag was returning as 'not a function', for whatever reason...
        // const showImage = this.object.getFlag(PinCushion.MODULE_NAME, PinCushion.FLAGS.SHOW_IMAGE);
        const showImage = getProperty(this.object.data.flags[PinCushion.MODULE_NAME],PinCushion.FLAGS.SHOW_IMAGE);

        let content;
        if(showImage){
          content = "<img class='image' src='" + entry.data.img + "' alt='Journal Entry Image'></img>"
        }else{
          const previewType = game.settings.get(PinCushion.MODULE_NAME, "previewType");

          if (previewType === "html") {
              content = TextEditor.enrichHTML(entry.data.content, {secrets: entry.isOwner, documents: true});
          } else if (previewType === "text") {
              const previewMaxLength = game.settings.get(PinCushion.MODULE_NAME, "previewMaxLength");

              const textContent = $(entry.data.content).text();
              content = textContent.length > previewMaxLength ? `${textContent.substr(0, previewMaxLength)} ...` : textContent;
          }
        }


        data.title = entry.data.name;
        data.body = content;

        return data;
    }

    /**
     * Set app position
     */
    setPosition() {
        if (!this.object) return;

        const position = {
            width: 400,
            height: 500,
            left: this.object.x,
            top: this.object.y,
            "font-size": canvas.grid.size / 5 + "px"
        };
        this.element.css(position);
    }
}

class BackgroundlessControlIcon extends ControlIcon {
  /**
   * Override ControlIcon#draw to remove drawing of the background.
   */
  async draw() {
    // Draw border
    this.border
      .clear()
      .lineStyle(2, this.borderColor, 1.0)
      .drawRoundedRect(...this.rect, 5)
      .endFill();
    this.border.visible = false;

    // Draw icon
    this.icon.texture = this.texture ?? (this.iconSrc ? await loadTexture(this.iconSrc) : "");
    this.icon.width = this.icon.height = this.size;
    this.icon.tint = Number.isNumeric(this.tintColor) ? this.tintColor : 0xffffff;
    return this;
  }
}

/**
 * Sets whether this Note is revealed (visible) to players; overriding the default FoundryVTT rules.
 * The iconTint will also be set on the Note based on whether there is a link that the player can access.
 * If this function is never called then the default FoundryVTT visibility rules will apply
 * @param [NoteData] [notedata] The NoteData whose visibility is to be set (can be used before the Note has been created)
 * @param {Boolean}  [visible]  pass in true if the Note should be revealed to players
 */
export function setNoteRevealed(notedata,visible) {
  const revealedNotes = game.settings.get(PinCushion.MODULE_NAME, "revealedNotes");
  if(revealedNotes){
    visible = getProperty(notedata,`flags.${PinCushion.MODULE_NAME}.${PinCushion.FLAGS.PIN_IS_REVEALED}`);
    if(visible){
      const revealedNotesTintColorLink = game.settings.get(PinCushion.MODULE_NAME, "revealedNotesTintColorLink");
      const revealedNotesTintColorNotLink = game.settings.get(PinCushion.MODULE_NAME, "revealedNotesTintColorNotLink");
      const FLAG_IS_REVEALED  = `flags.${PinCushion.MODULE_NAME}.${PinCushion.FLAGS.PIN_IS_REVEALED}`;
      const FLAG_USE_REVEALED = `flags.${PinCushion.MODULE_NAME}.${PinCushion.FLAGS.USE_PIN_REVEALED}`;
      // notedata might not exist as a Note, so setFlag is not available
      setProperty(notedata, FLAG_USE_REVEALED, true);
      setProperty(notedata, FLAG_IS_REVEALED,  visible);
      // Default tint based on GM view
      let tint = game.settings.get(PinCushion.MODULE_NAME, notedata.entryId ? "revealedNotesTintColorLink" : "revealedNotesTintColorNotLink");
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
export function setNoteGMtext(notedata,text) {
	// notedata might not exist as a Note, so setFlag is not available
	setProperty(notedata, `flags.${PinCushion.MODULE_NAME}.${PinCushion.FLAGS.PIN_GM_TEXT}`, text);
}

/* -------------------------------------------------------------------------- */
/*                                    Hooks                                   */
/* -------------------------------------------------------------------------- */

/**
 * Hook on init
 */
Hooks.on("init", () => {
  globalThis.PinCushion = PinCushion;
  // globalThis.setNoteRevealed = setNoteRevealed; // Seem not necessary
  // globalThis.setNoteGMtext = setNoteGMtext // Seem not necessary
  PinCushion._registerSettings();

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

/*
 * Hook on ready
 */
Hooks.on("ready", () => {
    // Instantiate PinCushion instance for central socket request handling
    game.pinCushion = new PinCushion();
    // Wait for game to exist, then register socket handler
    game.socket.on(`module.${PinCushion.MODULE_NAME}`, game.pinCushion._onSocket);
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

    if (!showPreview) {
        return;
    }

    if (!hovered) {
        clearTimeout(game.pinCushion.hoverTimer);
        return canvas.hud.pinCushion.clear();
    }

    if (hovered) {
        game.pinCushion.hoverTimer = setTimeout(function() {
          canvas.hud.pinCushion.bind(note)
        }, previewDelay);
        return;
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
