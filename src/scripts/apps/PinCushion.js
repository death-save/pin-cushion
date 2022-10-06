import CONSTANTS from "../constants.js";
import {
	i18n,
	i18nFormat,
	isAlt,
	log,
	retrieveFirstImageFromJournalId,
	stripQueryStringAndHashFromPath,
} from "../lib/lib.js";
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
		const defaultPermission = game.settings.get(PinCushion.MODULE_NAME, "defaultJournalPermission");
		let defaultPermissionName = "NONE";
		if (String(defaultPermission) === "0") {
			defaultPermissionName = "NONE";
		}
		if (String(defaultPermission) === "1") {
			defaultPermissionName = "LIMITED";
		}
		if (String(defaultPermission) === "2") {
			defaultPermissionName = "OBSERVER";
		}
		if (String(defaultPermission) === "3") {
			defaultPermissionName = "OWNER";
		}
		// none, perUser, specificFolder
		const defaultFolder = game.settings.get(PinCushion.MODULE_NAME, "defaultJournalFolder");

		const specificFolder = game.settings.get(PinCushion.MODULE_NAME, "specificFolder");
		const specificFolderObj =
			game.journal.directory.folders.find((f) => f.name === specificFolder || f.id === specificFolder) ??
			game.journal.directory.folders[Number(specificFolder)] ??
			undefined;
		const specificFolderName = specificFolderObj ? specificFolderObj.name : "";

		const folders = game.journal.directory.folders
			.sort((a, b) => a.name.localeCompare(b.name))
			.filter((folder) => folder.displayed)
			.map((folder) => `<option value="${folder.id}">${folder.name}</option>`)
			.join("\n");

		return {
			content: `
            <div class="form-group">
              <label>
                <p class="notes">${i18n("pin-cushion.Name")}</p>
              </label>
              <input name="name" type="text"/>
              <label>
                <p class="notes">${i18n("pin-cushion.DefaultPermission")}</p>
              </label>
              <select id="cushion-permission" style="width: 100%;">
                <option value="0"
                  ${String(defaultPermission) === "0" ? "selected" : ""}>
                  ${i18n("PERMISSION.NONE")}${String(defaultPermission) === "0" ? " <i>(default)</i>" : ""}
                </option>
                <option value="1"
                  ${String(defaultPermission) === "1" ? "selected" : ""}>
                  ${i18n("PERMISSION.LIMITED")}${String(defaultPermission) === "1" ? " <i>(default)</i>" : ""}
                </option>
                <option value="2"
                  ${String(defaultPermission) === "2" ? "selected" : ""}>
                  ${i18n("PERMISSION.OBSERVER")}${String(defaultPermission) === "2" ? " <i>(default)</i>" : ""}
                </option>
                <option value="3"
                  ${String(defaultPermission) === "3" ? "selected" : ""}>
                  ${i18n("PERMISSION.OWNER")}${String(defaultPermission) === "3" ? " <i>(default)</i>" : ""}
                </option>
              </select>
              <label>
                <p class="notes">${i18n("pin-cushion.Folder")}</p>
              </label>
              <select id="cushion-folder" style="width: 100%;">
                <option
                  value="none"
                  ${defaultFolder === "none" ? "selected" : ""}>
                    ${i18n("pin-cushion.None")}
                </option>
                <option value="perUser" ${defaultFolder === "perUser" ? "selected" : ""}>
                  ${i18n("pin-cushion.PerUser")} <i>(${game.user.name})</i>
                </option>
                <option
                  value="specificFolder"
                  ${defaultFolder === "specificFolder" ? "selected" : ""}>
                    ${i18n("pin-cushion.PerSpecificFolder")} <i>(${specificFolderName})</i>
                </option>
                <option disabled>──${i18n("pin-cushion.ExistingFolders")}──</option>
                ${folders}
              </select>
            </div>
            </br>
            `,
			title: "Create a Map Pin",
		};
	}

	static get NOTESLAYER() {
		return "NotesLayer";
	}

	static get FONT_SIZE() {
		return 16;
	}

	static get FLAGS() {
		return {
			USE_PIN_REVEALED: "usePinRevealed",
			PIN_IS_REVEALED: "pinIsRevealed",
			PIN_GM_TEXT: "gmNote",
			HAS_BACKGROUND: "hasBackground",
			RATIO: "ratio",
			TEXT_ALWAYS_VISIBLE: "textAlwaysVisible",
			PLAYER_ICON_STATE: "PlayerIconState",
			PLAYER_ICON_PATH: "PlayerIconPath",
			CUSHION_ICON: "cushionIcon",
			SHOW_IMAGE: "showImage",
			SHOW_IMAGE_EXPLICIT_SOURCE: "showImageExplicitSource",
			HIDE_LABEL: "hideLabel",
			DO_NOT_SHOW_JOURNAL_PREVIEW: "doNotShowJournalPreview",
			TOOLTIP_PLACEMENT: "tooltipPlacement",
			TOOLTIP_COLOR: "tooltipColor",
			TOOLTIP_FORCE_REMOVE: "tooltipForceRemove",
			TOOLTIP_SMART_PLACEMENT: "tooltipSmartPlacement",
			TOOLTIP_FOLLOW_MOUSE: "tooltipFollowMouse",
			PREVIEW_AS_TEXT_SNIPPET: "previewAsTextSnippet",
			ABOVE_FOG: "aboveFog",
			SHOW_ONLY_TO_GM: "showOnlyToGM",
			PIN_IS_TRANSPARENT: "pinIsTransparent",
		};
	}

	/**
	 * Render a file-picker button linked to an <input> field
	 * @param {object} options              Helper options
	 * @param {string} [options.type]       The type of FilePicker instance to display
	 * @param {string} [options.target]     The field name in the target data
	 * @param {string} [options.customClass] The field name in the custom class
	 * @return {Handlebars.SafeString|string}
	 */
	static filePicker(type, target, customClass = "file-picker") {
		// const type = options.hash['type'];
		// const target = options.hash['target'];
		if (!target) throw new Error("You must define the name of the target field.");

		// Do not display the button for users who do not have browse permission
		if (game.world && !game.user.can("FILES_BROWSE")) return "";

		// Construct the HTML
		const tooltip = game.i18n.localize("FILES.BrowseTooltip");
		return new Handlebars.SafeString(`
    <button type="button" name="${customClass}" class="${customClass}" data-type="${type}" data-target="${target}" title="${tooltip}" tabindex="-1">
        <i class="fas fa-file-import fa-fw"></i>
    </button>`);
	}

	/* --------------------------------- Methods -------------------------------- */

	/**
	 * Creates and renders a dialog for name entry
	 * @param {*} data
	 * break callbacks out into separate methods
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
					},
				},
				cancel: {
					label: "Cancel",
					icon: `<i class="fas fa-times"></i>`,
					callback: (e) => {
						// Maybe do something in the future
					},
				},
			},
			default: "save",
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
			ui.notifications.warn(i18n("pin-cushion.MissingPinName"));
			return;
		}
		// Permissions the Journal Entry will be created with
		const permission = {
			[game.userId]: CONST.DOCUMENT_PERMISSION_LEVELS.OWNER,
			default: parseInt($("#cushion-permission").val()),
		};

		const defaultJournalPermission = game.settings.get(PinCushion.MODULE_NAME, "defaultJournalPermission");
		if (permission.default === 0 && defaultJournalPermission >= 0) {
			permission.default = defaultJournalPermission;
		}

		// Get folder ID for Journal Entry
		let folder;
		const selectedFolder = $("#cushion-folder").val();
		if (selectedFolder === "none") {
			folder = undefined;
		} else if (selectedFolder === "perUser") {
			folder = PinCushion.getFolder(game.user.name, selectedFolder);
			if (!game.user.isGM && folder === undefined) {
				// Request folder creation when perUser is set and the entry is created by a user
				// Since only the ID is required, instantiating a Folder from the data is not necessary
				// folder = (await PinCushion.requestEvent({ action: "createFolder" }))?._id;
				// TODO for some reason this will give me a error
				// folder = (await pinCushionSocket.executeAsGM('requestEvent', { action: "createFolder" }))?._id;
			}
		} else if (selectedFolder === "specificFolder") {
			const settingSpecificFolder = game.settings.get(PinCushion.MODULE_NAME, "specificFolder");
			folder = PinCushion.getFolder(game.user.name, selectedFolder, settingSpecificFolder);
		} else {
			folder = selectedFolder; // Folder is already given as ID
		}
		const entry = await JournalEntry.create({
			name: `${input[0].value}`,
			permission,
			...(folder && { folder }),
		});

		if (!entry) {
			return;
		}

		// offsely add fields required by Foundry's drop handling
		const entryData = entry.document.toJSON();
		entryData.id = entry.id;
		entryData.type = "JournalEntry";

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
			case "none":
				return undefined;
			// Target folder should match the user's name
			case "perUser":
				return game.journal.directory.folders.find((f) => f.name === name)?.id ?? undefined;
			case "specificFolder":
				return (
					game.journal.directory.folders.find((f) => f.name === folderName || f.id === folderName)?.id ??
					game.journal.directory.folders[Number(folderName)]?.id ??
					undefined
				);
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
					title: i18n("pin-cushion.CreateMissingFoldersT"),
					content: i18n("pin-cushion.CreateMissingFoldersC"),
					buttons: {
						yes: {
							label: `<i class="fas fa-check"></i> ${i18n("Yes")}`,
							callback: () => resolve(true),
						},
						no: {
							label: `<i class="fas fa-times"></i> ${i18n("No")}`,
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
	 * @param {*} noteData
	 */
	static _replaceIconSelector(app, html, noteData, explicitImageValue) {
		const currentIconSelector = stripQueryStringAndHashFromPath(
			explicitImageValue ? explicitImageValue : noteData.document.texture.src
		);
		// you can see this only if you have the file browser permissions
		if (game.user.can("FILES_BROWSE")) {
			const filePickerHtml = `
        <img class="pin-cushion-journal-icon" src="${currentIconSelector}" />
        <input
          type="text"
          name="icon"
          title="Icon Path"
          class="icon-path"
          value="${currentIconSelector}"
          placeholder="/icons/example.svg"
          data-dtype="String"></input>
          ${this.filePicker("image", `icon`, `file-picker`)}
        `;

			/*
      <button type="button"
        name="file-picker"
        class="file-picker"
        data-type="image"
        data-target="icon"
        title="Browse Files"
        tabindex="-1">
        <i class="fas fa-file-import fa-fw"></i>
      </button>
      */

			const iconSelector = html.find("select[name='icon']");

			iconSelector.replaceWith(filePickerHtml);

			// Detect and activate file-picker buttons
			//html.find("button.file-picker").on("click", app._activateFilePicker.bind(app));
			html.find("button.file-picker").each((i, button) => (button.onclick = app._activateFilePicker.bind(app)));
		}
	}

	static _addTooltipHandler(app, html, data) {
		const iconAnchor = html.find("[name=icon]").closest(".form-group");
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

		iconAnchor.after(`
      <div class="form-group">
        <label
          for="flags.${PinCushion.MODULE_NAME}.${PinCushion.FLAGS.TOOLTIP_PLACEMENT}">
          ${i18n("pin-cushion.Tooltip.Placement.title")}
        </label>
        <div class="form-fields">
          <select
            id="cushion-permission"
            style="width: 100%;"
            name="flags.${PinCushion.MODULE_NAME}.${PinCushion.FLAGS.TOOLTIP_PLACEMENT}">
            <option
              value="nw-alt"
              ${tooltipPlacement === "nw-alt" ? "selected" : ""}>
                ${i18n("pin-cushion.Tooltip.Placement.choices.north-west-alt")}
            </option>
            <option
              value="nw"
              ${tooltipPlacement === "nw" ? "selected" : ""}>
                ${i18n("pin-cushion.Tooltip.Placement.choices.north-west")}
            </option>
            <option
              value="n"
              ${tooltipPlacement === "n" ? "selected" : ""}>
                ${i18n("pin-cushion.Tooltip.Placement.choices.north")}
              </option>
            <option
              value="ne"
              ${tooltipPlacement === "ne" ? "selected" : ""}>
                ${i18n("pin-cushion.Tooltip.Placement.choices.north-east")}
              </option>
            <option
              value="ne-alt"
              ${tooltipPlacement === "ne-alt" ? "selected" : ""}>
                ${i18n("pin-cushion.Tooltip.Placement.choices.north-east-alt")}
              </option>
            <option
              value="w"
              ${tooltipPlacement === "w" ? "selected" : ""}>
                ${i18n("pin-cushion.Tooltip.Placement.choices.west")}
              </option>
            <option
              value="e"
              ${tooltipPlacement === "e" ? "selected" : ""}>
                ${i18n("pin-cushion.Tooltip.Placement.choices.east")}
              </option>
            <option
              value="sw-alt"
              ${tooltipPlacement === "sw-alt" ? "selected" : ""}>
                ${i18n("pin-cushion.Tooltip.Placement.choices.south-west-alt")}
              </option>
            <option
              value="sw"
              ${tooltipPlacement === "sw" ? "selected" : ""}>
                ${i18n("pin-cushion.Tooltip.Placement.choices.south-west")}
            </option>
            <option
              value="s"
              ${tooltipPlacement === "s" ? "selected" : ""}>
                ${i18n("pin-cushion.Tooltip.Placement.choices.south")}
            </option>
            <option
              value="se"
              ${tooltipPlacement === "se" ? "selected" : ""}>
                ${i18n("pin-cushion.Tooltip.Placement.choices.south-east")}
            </option>
            <option
              value="se-alt"
              ${tooltipPlacement === "se-alt" ? "selected" : ""}>
                ${i18n("pin-cushion.Tooltip.Placement.choices.south-east-alt")}
            </option>
          </select>
        </div>
      </div>
      <div class="form-group">
        <label
          for="flags.${PinCushion.MODULE_NAME}.${PinCushion.FLAGS.TOOLTIP_COLOR}">
            ${i18n("pin-cushion.Tooltip.Color.title")}
        </label>
        <div class="form-fields">
          <select
            id="cushion-permission"
            style="width: 100%;"
            name="flags.${PinCushion.MODULE_NAME}.${PinCushion.FLAGS.TOOLTIP_COLOR}">
            <option
            value="" ${tooltipColor === "" ? "selected" : ""}>
              ${i18n("pin-cushion.Tooltip.Color.choices.default")}
            </option>
            <option
            value="blue"
            ${tooltipColor === "blue" ? "selected" : ""}>
              ${i18n("pin-cushion.Tooltip.Color.choices.blue")}
            </option>
            <option
            value="dark"
            ${tooltipColor === "dark" ? "selected" : ""}>
              ${i18n("pin-cushion.Tooltip.Color.choices.dark")}
            </option>
            <option
            value="green"
            ${tooltipColor === "green" ? "selected" : ""}>
              ${i18n("pin-cushion.Tooltip.Color.choices.green")}
            </option>
            <option
            value="light"
            ${tooltipColor === "light" ? "selected" : ""}>
              ${i18n("pin-cushion.Tooltip.Color.choices.light")}
            </option>
            <option
            value="orange"
            ${tooltipColor === "orange" ? "selected" : ""}>
              ${i18n("pin-cushion.Tooltip.Color.choices.orange")}
            </option>
            <option value="purple"
            ${tooltipColor === "purple" ? "selected" : ""}>
              ${i18n("pin-cushion.Tooltip.Color.choices.purple")}
            </option>
            <option
            value="red"
            ${tooltipColor === "red" ? "selected" : ""}>
              ${i18n("pin-cushion.Tooltip.Color.choices.red")}
            </option>
            <option
            value="yellow"
            ${tooltipColor === "yellow" ? "selected" : ""}>
              ${i18n("pin-cushion.Tooltip.Color.choices.yellow")}
            </option>
          </select>
        </div>
      </div>
      <div class="form-group">
        <label
          for="flags.${PinCushion.MODULE_NAME}.${PinCushion.FLAGS.TOOLTIP_FORCE_REMOVE}">
            ${i18n("pin-cushion.Tooltip.ForceRemove.title")}
        </label>
        <div class="form-fields">
          <input
            type="checkbox"
            name="flags.${PinCushion.MODULE_NAME}.${PinCushion.FLAGS.TOOLTIP_FORCE_REMOVE}"
            data-dtype="Boolean" ${tooltipForceRemove ? "checked" : ""} />
        </div>
      </div>
      <div class="form-group">
        <label
          for="flags.${PinCushion.MODULE_NAME}.${PinCushion.FLAGS.TOOLTIP_SMART_PLACEMENT}">
            ${i18n("pin-cushion.Tooltip.SmartPlacement.title")}
        </label>
        <div class="form-fields">
          <input
            type="checkbox"
            name="flags.${PinCushion.MODULE_NAME}.${PinCushion.FLAGS.TOOLTIP_SMART_PLACEMENT}"
            data-dtype="Boolean" ${tooltipSmartPlacement ? "checked" : ""} />
        </div>
      </div>
    `);

		// TODO FOLLOW MOUSE FEATURE IS NOT WORKING...
		/*
    <div class="form-group">
      <label
        for="flags.${PinCushion.MODULE_NAME}.${PinCushion.FLAGS.TOOLTIP_FOLLOW_MOUSE}">
          ${i18n('pin-cushion.Tooltip.FollowMouse.title')}
      </label>
      <div class="form-fields">
        <input
          type="checkbox"
          name="flags.${PinCushion.MODULE_NAME}.${PinCushion.FLAGS.TOOLTIP_FOLLOW_MOUSE}"
          data-dtype="Boolean" ${tooltipFollowMouse ? 'checked' : ''} />
      </div>
    </div>
    */

		// app.setPosition({ height: 'auto' });
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
		const iconTintGroup = html.find("[name=texture.tint]").closest(".form-group");
		const ratio =
			(app.document
				? app.document.getFlag(PinCushion.MODULE_NAME, PinCushion.FLAGS.RATIO)
				: app.object.getFlag(PinCushion.MODULE_NAME, PinCushion.FLAGS.RATIO)) ?? 1;
		const iconSizeGroup = html.find("[name=iconSize]").closest(".form-group");
		const textAlwaysVisible =
			(app.document
				? app.document.getFlag(PinCushion.MODULE_NAME, PinCushion.FLAGS.TEXT_ALWAYS_VISIBLE)
				: app.object.getFlag(PinCushion.MODULE_NAME, PinCushion.FLAGS.TEXT_ALWAYS_VISIBLE)) ?? false;
		const textAnchorGroup = html.find("[name=textAnchor]").closest(".form-group");

		const enableBackgroundlessPins = game.settings.get(PinCushion.MODULE_NAME, "enableBackgroundlessPins");
		if (enableBackgroundlessPins) {
			iconTintGroup.after(`
        <div class="form-group">
          <label
            for="flags.${PinCushion.MODULE_NAME}.${PinCushion.FLAGS.HAS_BACKGROUND}">
            ${i18n("pin-cushion.HasBackground")}
          </label>
          <div class="form-fields">
            <input
              type="checkbox"
              name="flags.${PinCushion.MODULE_NAME}.${PinCushion.FLAGS.HAS_BACKGROUND}"
              data-dtype="Boolean" ${hasBackground ? "checked" : ""} />
          </div>
        </div>`);
		}
		iconSizeGroup.after(`
      <div class="form-group">
        <label
          for="flags.${PinCushion.MODULE_NAME}.${PinCushion.FLAGS.RATIO}">
            ${i18n("pin-cushion.HasBackgroundRatio")}
        </label>
        <div class="form-fields">
          <input
            type="text"
            name="flags.${PinCushion.MODULE_NAME}.${PinCushion.FLAGS.RATIO}"
            data-dtype="Number"
            value="${ratio}" />
        </div>
      </div>
    `);

		textAnchorGroup.after(`
      <div class="form-group">
        <label for="flags.${PinCushion.MODULE_NAME}.${PinCushion.FLAGS.TEXT_ALWAYS_VISIBLE}">${i18n(
			`${PinCushion.MODULE_NAME}.TextAlwaysVisible`
		)}</label>
        <div class="form-fields">
          <input type="checkbox" name="flags.${PinCushion.MODULE_NAME}.${
			PinCushion.FLAGS.TEXT_ALWAYS_VISIBLE
		}" data-dtype="Boolean" ${textAlwaysVisible ? "checked" : ""}>
        </div>
      </div>
    `);
		// app.setPosition({ height: 'auto' });
	}

	/**
	 * Add show image field
	 * @param {*} app
	 * @param {*} html
	 * @param {*} noteData
	 */
	static _addShowImageField(app, html, noteData) {
		const showImageExplicitSource = stripQueryStringAndHashFromPath(
			app.object.getFlag(PinCushion.MODULE_NAME, PinCushion.FLAGS.SHOW_IMAGE_EXPLICIT_SOURCE) ??
				noteData.document.texture.src
		);
		// const iconPinCushion = stripQueryStringAndHashFromPath(
		//   app.object.getFlag(PinCushion.MODULE_NAME, PinCushion.FLAGS.CUSHION_ICON) ?? noteData.document.texture.src,
		// );

		// you can see this only if you have the file browser permissions
		let filePickerHtml = "";
		if (game.user.can("FILES_BROWSE")) {
			filePickerHtml = `
        <div class="form-group">
            <label
              for="flags.${PinCushion.MODULE_NAME}.${PinCushion.FLAGS.SHOW_IMAGE_EXPLICIT_SOURCE}"
              >${i18n("pin-cushion.ShowImageExplicitSource")}</label>
            <div class="form-fields">
              <img class="pin-cushion-journal-icon" src="${showImageExplicitSource}" />
              <input
                type="text"
                name="flags.${PinCushion.MODULE_NAME}.${PinCushion.FLAGS.SHOW_IMAGE_EXPLICIT_SOURCE}"
                title="${i18n("pin-cushion.ShowImageExplicitSource")}"
                class="icon-path"
                value="${showImageExplicitSource}"
                placeholder="/icons/example.svg"
                data-dtype="String"
                >
              </input>
              ${this.filePicker(
					"image",
					`flags.${PinCushion.MODULE_NAME}.${PinCushion.FLAGS.SHOW_IMAGE_EXPLICIT_SOURCE}`,
					`file-picker-showImageExplicitSource`
				)}
            </div>
        </div>`;
		}

		// Set to show image linked to the journal on the tooltip
		// a cushion icon is setted it will show that instead
		// make sense ?

		const showImage = app.object.getFlag(PinCushion.MODULE_NAME, PinCushion.FLAGS.SHOW_IMAGE) ?? false;
		const iconTintGroup = html.find("[name=texture.tint]").closest(".form-group");
		iconTintGroup.after(`
      <div class="form-group">
        <label
          for="flags.${PinCushion.MODULE_NAME}.${PinCushion.FLAGS.SHOW_IMAGE}">
          ${i18n("pin-cushion.ShowImage")}
        </label>
        <div class="form-fields">
          <input
            type="checkbox"
            name="flags.${PinCushion.MODULE_NAME}.${PinCushion.FLAGS.SHOW_IMAGE}"
            data-dtype="Boolean" ${showImage ? "checked" : ""}>
          </input>
        </div>
      </div>
      ${filePickerHtml}
    `);
		// app.setPosition({ height: 'auto' });
		html.find("button.file-picker-showImageExplicitSource").each(
			(i, button) => (button.onclick = app._activateFilePicker.bind(app))
		);
	}

	/**
	 * Add pin is transparent field
	 * @param {*} app
	 * @param {*} html
	 * @param {*} data
	 */
	static _addPinIsTransparentField(app, html, data) {
		const pinIsTransparent =
			app.object.getFlag(PinCushion.MODULE_NAME, PinCushion.FLAGS.PIN_IS_TRANSPARENT) ?? false;
		const iconTintGroup = html.find("[name=texture.tint]").closest(".form-group");
		iconTintGroup.after(`
      <div class="form-group">
        <label
          for="flags.${PinCushion.MODULE_NAME}.${PinCushion.FLAGS.PIN_IS_TRANSPARENT}">
          ${i18n("pin-cushion.PinIsTransparent")}
        </label>
        <div class="form-fields">
          <input
            type="checkbox"
            name="flags.${PinCushion.MODULE_NAME}.${PinCushion.FLAGS.PIN_IS_TRANSPARENT}"
            data-dtype="Boolean" ${pinIsTransparent ? "checked" : ""}>
          </input>
        </div>
      </div>
    `);
		// app.setPosition({ height: 'auto' });
	}

	/**
	 * Add pin is transparent field
	 * @param {*} app
	 * @param {*} html
	 * @param {*} data
	 */
	static _addShowOnlyToGMField(app, html, data) {
		const showOnlyToGM = app.object.getFlag(PinCushion.MODULE_NAME, PinCushion.FLAGS.SHOW_ONLY_TO_GM) ?? false;
		const iconTintGroup = html.find("[name=texture.tint]").closest(".form-group");
		iconTintGroup.after(`
      <div class="form-group">
        <label
          for="flags.${PinCushion.MODULE_NAME}.${PinCushion.FLAGS.SHOW_ONLY_TO_GM}">
          ${i18n("pin-cushion.ShowOnlyToGM")}
        </label>
        <div class="form-fields">
          <input
            type="checkbox"
            name="flags.${PinCushion.MODULE_NAME}.${PinCushion.FLAGS.SHOW_ONLY_TO_GM}"
            data-dtype="Boolean" ${showOnlyToGM ? "checked" : ""}>
          </input>
        </div>
      </div>
    `);
		// app.setPosition({ height: 'auto' });
	}

	/**
	 * Replaces icon selector in Notes Config form with filepicker and adds fields to set player-only note icons.
	 * @param {*} app
	 * @param {*} html
	 * @param {*} noteData
	 */
	static _addPlayerIconField(app, html, noteData) {
		/* Adds fields to set player-only note icons */
		/* Get default values set by GM */
		const defaultState = game.settings.get(PinCushion.MODULE_NAME, "playerIconAutoOverride");
		const defaultPath = game.settings.get(PinCushion.MODULE_NAME, "playerIconPathDefault");

		const state =
			getProperty(noteData, `document.flags.${PinCushion.MODULE_NAME}.${PinCushion.FLAGS.PLAYER_ICON_STATE}`) ??
			defaultState;
		const path = stripQueryStringAndHashFromPath(
			getProperty(noteData, `document.flags.${PinCushion.MODULE_NAME}.${PinCushion.FLAGS.PLAYER_ICON_PATH}`) ??
				defaultPath
		);

		/* Set HTML to be added to the note-config */
		const playerIconHtml = `<hr>
        <!-- Button to Enable overrides -->
        <div class="form-group">
          <label>${i18n("pin-cushion.UsePlayerIcon")}</label>
          <div class="form-fields">
            <input
              type="checkbox"
              name="flags.${PinCushion.MODULE_NAME}.${PinCushion.FLAGS.PLAYER_ICON_STATE}"
              data-dtype="Boolean" ${state ? "checked" : ``} />
          </div>
          <p class="notes">${i18n("pin-cushion.PlayerIconHint")}</p>
        </div>
        <!-- Player Icon -->
        <div class="form-group">
          <label>${i18n("pin-cushion.PlayerIconPath")}</label>
          <div class="form-fields">
            <!--
            <select name="icon">
            </select>
            -->
            <img class="pin-cushion-journal-icon" src="${path ? path : ``}" />
            <input type="text"
              name="flags.${PinCushion.MODULE_NAME}.${PinCushion.FLAGS.PLAYER_ICON_PATH}"
              title="Icon Path" class="icon-path" value="${path ? path : ``}"
              data-dtype="String" />
            ${this.filePicker(
				"image",
				`flags.${PinCushion.MODULE_NAME}.${PinCushion.FLAGS.PLAYER_ICON_PATH}`,
				`file-picker`
			)}
          </div>
        </div>`;

		/*
        <button type="button" name="file-picker"
            class="file-picker" data-type="image"
            data-target="flags.${PinCushion.MODULE_NAME}.${PinCushion.FLAGS.PLAYER_ICON_PATH}"
        title="Browse Files" tabindex="-1">
        <i class="fas fa-file-import fa-fw"></i>
        </button>
        */

		// Insert Player Icon handling at end of config
		html.find("button[name='submit']").before(playerIconHtml);
	}

	static _addNoteGM(app, html, noteData) {
		let gmNoteFlagRef = `flags.${PinCushion.MODULE_NAME}.${PinCushion.FLAGS.PIN_GM_TEXT}`;
		// Input for GM Label
		let gmtext = noteData.document.getFlag(PinCushion.MODULE_NAME, PinCushion.FLAGS.PIN_GM_TEXT);
		if (!gmtext) gmtext = "";
		let gm_text_h = $(
			`<div class="form-group">
        <label for="${gmNoteFlagRef}">${i18n("pin-cushion.GMLabel")}</label>
        <div class="form-fields">
          <textarea
            name="${gmNoteFlagRef}">${gmtext.trim() ?? ""}</textarea>
        </div>
      </div>`
		);
		// html.find("input[name='text']").parent().parent().after(gm_text_h);

		/*
    <div class="form-group">
        <label>Text Label</label>
        <div class="form-fields">
            <input type="text" name="text" value="as22" placeholder="TEST4">
        </div>
    </div>
    */

		// <input type="text" name="text" value="${initial_text.trim() ?? ''}" placeholder="${noteData.entry.name}">

		// Multiline input for Text Label
		// this.document.text || this.entry?.name || "Unknown"
		let initial_text = noteData.document.text ?? noteData.entry?.name;
		if (!initial_text) initial_text = "";
		let initial_text_h = $(
			`<div class="form-group">
        <label for="text">${i18n("pin-cushion.PlayerLabel")}</label>
        <div class="form-fields">
          <textarea name="text"
            placeholder="${noteData.entry?.name ?? ""}">${initial_text.trim() ?? ""}</textarea>
        </div>
      </div>`
		);
		html.find("input[name='text']").parent().parent().after(initial_text_h);

		// Hide the old text label input field
		html.find("input[name='text']").parent().parent().remove();

		html.find("textarea[name='text']").parent().parent().before(gm_text_h);

		//let reveal_icon = $(`<div class='form-group'><label>Icon follows Reveal</label><div class='form-fields'><input type='checkbox' name='useRevealIcon'></div></div>`)
		//html.find("select[name='icon']").parent().parent().after(reveal_icon);

		// // Force a recalculation of the height
		// if (!app._minimized) {
		//   let pos = app.position;
		//   pos.height = 'auto';
		//   app.setPosition(pos);
		// }
	}

	static _addNoteTintColorLink(app, html, noteData) {
		const FLAG_IS_REVEALED = `flags.${PinCushion.MODULE_NAME}.${PinCushion.FLAGS.PIN_IS_REVEALED}`;
		const FLAG_USE_REVEALED = `flags.${PinCushion.MODULE_NAME}.${PinCushion.FLAGS.USE_PIN_REVEALED}`;

		// Check box to control use of REVEALED state
		let checked =
			noteData.document.getFlag(PinCushion.MODULE_NAME, PinCushion.FLAGS.PIN_IS_REVEALED) ?? true
				? "checked"
				: "";
		let revealed_control = $(
			`<div class='form-group'>
        <label>${i18n("pin-cushion.RevealedToPlayer")}</label>
        <div class='form-fields'>
          <input
          type='checkbox'
          name='${FLAG_IS_REVEALED}' ${checked} />
        </div>
      </div>`
		);
		html.find("select[name='entryId']").parent().parent().after(revealed_control);

		// Check box for REVEALED state
		let use_reveal =
			noteData.document.getFlag(PinCushion.MODULE_NAME, PinCushion.FLAGS.USE_PIN_REVEALED) ?? false
				? "checked"
				: "";
		let mode_control = $(
			`<div class='form-group'>
        <label>${i18n("pin-cushion.UseRevealState")}</label>
        <div class='form-fields'>
          <input
            type='checkbox'
            name='${FLAG_USE_REVEALED}' ${use_reveal} />
        </div>
      </div>`
		);
		html.find("select[name='entryId']").parent().parent().after(mode_control);

		// Force a recalculation of the height
		// if (!app._minimized) {
		//   let pos = app.position;
		//   pos.height = 'auto';
		//   app.setPosition(pos);
		// }
	}

	static _addHideLabel(app, html, data) {
		const hideLabel =
			(app.document
				? app.document.getFlag(PinCushion.MODULE_NAME, PinCushion.FLAGS.HIDE_LABEL)
				: app.object.getFlag(PinCushion.MODULE_NAME, PinCushion.FLAGS.HIDE_LABEL)) ?? false;
		const textGroup = html.find("[name=text]").closest(".form-group");
		textGroup.after(`
      <div class="form-group">
        <label
          for="flags.${PinCushion.MODULE_NAME}.${PinCushion.FLAGS.HIDE_LABEL}">
            ${i18n("pin-cushion.HideLabel")}
        </label>
        <div class="form-fields">
          <input
            type="checkbox"
            name="flags.${PinCushion.MODULE_NAME}.${PinCushion.FLAGS.HIDE_LABEL}"
            data-dtype="Boolean" ${hideLabel ? "checked" : ""} />
        </div>
      </div>
    `);
	}

	static _addDoNotShowJournalPreview(app, html, data) {
		let doNotShowJournalPreviewS = String(
			app.document
				? app.document.getFlag(PinCushion.MODULE_NAME, PinCushion.FLAGS.DO_NOT_SHOW_JOURNAL_PREVIEW)
				: app.object.getFlag(PinCushion.MODULE_NAME, PinCushion.FLAGS.DO_NOT_SHOW_JOURNAL_PREVIEW)
		);
		if (doNotShowJournalPreviewS !== "true" && doNotShowJournalPreviewS !== "false") {
			doNotShowJournalPreviewS = "true";
		}
		const doNotShowJournalPreview = String(doNotShowJournalPreviewS) === "true" ? true : false;

		// if(app.document && app.document.getFlag(PinCushion.MODULE_NAME,PinCushion.FLAGS.DO_NOT_SHOW_JOURNAL_PREVIEW)!==doNotShowJournalPreview){
		//   app.document.setFlag(PinCushion.MODULE_NAME,PinCushion.FLAGS.DO_NOT_SHOW_JOURNAL_PREVIEW,doNotShowJournalPreview);
		// }else if(app.object && app.object.getFlag(PinCushion.MODULE_NAME,PinCushion.FLAGS.DO_NOT_SHOW_JOURNAL_PREVIEW)!==doNotShowJournalPreview){
		//   app.object.setFlag(PinCushion.MODULE_NAME,PinCushion.FLAGS.DO_NOT_SHOW_JOURNAL_PREVIEW,doNotShowJournalPreview);
		// }

		const textGroup = html.find("[name=text]").closest(".form-group");
		textGroup.after(`
      <div class="form-group">
        <label
          for="flags.${PinCushion.MODULE_NAME}.${PinCushion.FLAGS.DO_NOT_SHOW_JOURNAL_PREVIEW}">
          ${i18n("pin-cushion.DoNotShowJournalPreview")}
        </label>
        <div class="form-fields">
          <input
            type="checkbox"
            name="flags.${PinCushion.MODULE_NAME}.${PinCushion.FLAGS.DO_NOT_SHOW_JOURNAL_PREVIEW}"
            data-dtype="Boolean" ${doNotShowJournalPreview ? "checked" : ""} />
        </div>
      </div>
    `);
	}
	/*
  static _addAboveFog(app, html, data) {
    let aboveFogS = String(
      app.document
        ? app.document.getFlag(PinCushion.MODULE_NAME, PinCushion.FLAGS.ABOVE_FOG)
        : app.object.getFlag(PinCushion.MODULE_NAME, PinCushion.FLAGS.ABOVE_FOG),
    );
    if (aboveFogS !== 'true' && aboveFogS !== 'false') {
      aboveFogS = 'false';
    }
    const aboveFog = String(aboveFogS) === 'true' ? true : false;

    const textGroup = html.find('[name=text]').closest('.form-group');
    textGroup.after(`
      <div class="form-group">
        <label
          for="flags.${PinCushion.MODULE_NAME}.${PinCushion.FLAGS.ABOVE_FOG}">
          ${i18n('pin-cushion.AboveFog')}
        </label>
        <div class="form-fields">
          <input
            type="checkbox"
            name="flags.${PinCushion.MODULE_NAME}.${PinCushion.FLAGS.ABOVE_FOG}"
            data-dtype="Boolean" ${aboveFog ? 'checked' : ''} />
        </div>
      </div>
    `);
  }
  */
	static _addPreviewAsTextSnippet(app, html, data) {
		const previewAsTextSnippet =
			(app.document
				? app.document.getFlag(PinCushion.MODULE_NAME, PinCushion.FLAGS.PREVIEW_AS_TEXT_SNIPPET)
				: app.object.getFlag(PinCushion.MODULE_NAME, PinCushion.FLAGS.PREVIEW_AS_TEXT_SNIPPET)) ?? false;

		const textGroup = html.find("[name=text]").closest(".form-group");
		textGroup.after(`
      <div class="form-group">
        <label
          for="flags.${PinCushion.MODULE_NAME}.${PinCushion.FLAGS.PREVIEW_AS_TEXT_SNIPPET}">
          ${i18n("pin-cushion.PreviewAsTextSnippet")}
        </label>
        <div class="form-fields">
          <input
            type="checkbox"
            name="flags.${PinCushion.MODULE_NAME}.${PinCushion.FLAGS.PREVIEW_AS_TEXT_SNIPPET}"
            data-dtype="Boolean" ${previewAsTextSnippet ? "checked" : ""} />
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
	static _addDrawTooltipWithNoteGM(wrapped, ...args) {
		//const enableNoteGM = game.settings.get(PinCushion.MODULE_NAME, 'noteGM');

		const hideLabel =
			(this.document
				? this.document.getFlag(PinCushion.MODULE_NAME, PinCushion.FLAGS.HIDE_LABEL)
				: this.object.getFlag(PinCushion.MODULE_NAME, PinCushion.FLAGS.HIDE_LABEL)) ?? false;

		// Only override default if flag(PinCushion.MODULE_NAME,PinCushion.FLAGS.PIN_GM_TEXT) is set
		if (game.user.isGM) {
			const newtextGM = this.document.getFlag(PinCushion.MODULE_NAME, PinCushion.FLAGS.PIN_GM_TEXT);
			if (newtextGM && newtextGM.length > 0) {
				let result = wrapped(...args);
				if (hideLabel) {
					result.text = "";
					// this.document.text = '';
				} else {
					result.text = newtextGM;
					// this.document.text = newtextGM;
				}
				return result;
			}
		}

		//// Set a different label to be used while we call the original Note.prototype._drawTooltip
		////
		//// Note#text          = get text()  { return this.document.label; }
		//// NoteDocument#label = get label() { return this.text || this.entry?.name || "Unknown"; }
		//// but NoteDocument#document.text can be modified :-)
		////
		//// let saved_text = this.document.text;
		// this.document.text = newtext;
		let result = wrapped(...args);
		//// this.document.text = saved_text;

		if (hideLabel) {
			result.text = "";
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
			result.text = "";
		}
		return result;
	}

	/**
	 * Wraps the default Note#isVisible to allow the visibility of scene Notes to be controlled by the reveal
	 * state stored in the Note (overriding the default visibility which is based on link accessibility).
	 * @param {function} [wrapped] The wrapper function provided by libWrapper
	 * @param {Object}   [args]    The arguments for Note#refresh
	 * @return [Note]    This Note
	 */
	static _isVisible(wrapped, ...args) {
		let result = wrapped(...args);
		const showOnlyToGM = this.document.getFlag(PinCushion.MODULE_NAME, PinCushion.FLAGS.SHOW_ONLY_TO_GM) ?? false;
		if (String(showOnlyToGM) === "true") {
			if (!game.user.isGM) {
				return false;
			}
		}
		/*
        We only want to change the check of testUserPermission here
        Note#isVisible()
            const accessTest = this.page ? this.page : this.entry;
            const access = accessTest?.testUserPermission(game.user, "LIMITED") ?? true;
            if ( (access === false) || !canvas.effects.visibility.tokenVision || this.document.global ) return access;
            const point = {x: this.document.x, y: this.document.y};
            const tolerance = this.document.iconSize / 4;
            return canvas.effects.visibility.testVisibility(point, {tolerance, object: this});
        */
		// See if reveal state is enabled for this note.
		if (!this.document.getFlag(CONSTANTS.MODULE_NAME, PinCushion.FLAGS.USE_PIN_REVEALED)) {
			return wrapped(...args);
		}

		// Replace the testUserPermission test of Note#isVisible
		const access = this.document.getFlag(CONSTANTS.MODULE_NAME, PinCushion.FLAGS.PIN_IS_REVEALED);
		// Standard version of Note#isVisible
		if (access === false || !canvas.effects.visibility.tokenVision || this.document.global) {
			return access;
		}
		const point = { x: this.document.x, y: this.document.y };
		const tolerance = this.document.iconSize / 4;
		return canvas.effects.visibility.testVisibility(point, { tolerance, object: this });
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
		if (textAlwaysVisible === true) {
			// Keep tooltip always visible
			// Though could make an option out of that too. Would be nicer
			// TODO it's seem we don't need this
			// this.position.set(this.document.x, this.document.y);
			// this.controlIcon.border.visible = this._hover;

			// textVisible = true;
			this.tooltip.visible = true;
		}
		// this.tooltip.visible = textVisible;
		//this.visible = this.entry?.testUserPermission(game.user, "LIMITED") ?? true;

		let text = this.children[1]; // 0 is the ControlIcon, 1 is the PreciseText
		// Text is created bevor this point. So we can modify it here.
		let ratio = this.document.getFlag(PinCushion.MODULE_NAME, PinCushion.FLAGS.RATIO);
		if (ratio) {
			text.x = (this.size * (ratio - 1)) / 2; // correct shifting for the new scale.
		}
		// Bug fixing :Always (when hover) show name of pin up (above) to others pin
		// https://stackoverflow.com/questions/24909371/move-item-in-array-to-last-position
		if (!isAlt() && this._hover) {
			const fromIndex = canvas.notes.placeables.findIndex((note) => note.id === this.id) || 0;
			canvas.notes.placeables.push(canvas.notes.placeables.splice(fromIndex, 1)[0]);
		}

		/*
        // NEW FEATURE : Above fog feature
        let aboveFogS = String(
        getProperty(this.document, `this.document.flags.${PinCushion.MODULE_NAME}.${PinCushion.FLAGS.ABOVE_FOG}`),
        );
        if (aboveFogS !== 'true' && aboveFogS !== 'false') {
        aboveFogS = 'false';
        }
        const aboveFog = String(aboveFogS) === 'true' ? true : false;
        if(aboveFog){
        setProperty(this,`zIndex`, 300);
        }
        */

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
					permission: i18n("PERMISSION.JournalCreate"),
				})
			);
			return;
		}

		const data = {
			clientX: event.data.global.x,
			clientY: event.data.global.y,
		};

		game.pinCushion._createDialog(data);
	}

	static async _onSingleClick(event) {
		log(
			`Note_onClickLeft: ${event.data.origin.x} ${event.data.origin.y} == ${event.data.global.x} ${event.data.global.y}`
		);
		// Create a new Note at the cursor position and open the Note configuration window for it.
		const noteData = { x: event.data.origin.x, y: event.data.origin.y };
		this._createPreview(noteData, { top: event.data.global.y - 20, left: event.data.global.x + 40 });
	}

	static _drawControlIconInternal(noteInternal) {
		// Wraps the default Note#_drawControlIcon so that we can override the stored icon tint based
		// on whether the link is accessible for the current player (or not). This is only done for links which
		// are using the "revealed" flag.
		const revealedNotes = game.settings.get(PinCushion.MODULE_NAME, "revealedNotes");
		if (revealedNotes) {
			if (game.user.isGM) {
				// Replacement for Note#_drawControlIcon for GMs, to show which pins are revealed.
				const is_revealed = noteInternal.document.getFlag(PinCushion.MODULE_NAME, PIN_IS_REVEALED);
				if (is_revealed != undefined) {
					const colour = game.settings.get(
						PinCushion.MODULE_NAME,
						is_revealed ? "revealedNotesTintColorRevealed" : "revealedNotesTintColorNotRevealed"
					);
					if (colour?.length > 0) {
						// Temporarily set the icon tint
						const saved = noteInternal.document.texture.tint;
						noteInternal.document.texture.tint = colour;
						// const result = wrapped(...args);
						noteInternal.document.texture.tint = saved;
						// return result;
					}
				}
			} else {
				// if (!noteInternal.document.getFlag(MODULE_NAME, USE_PIN_REVEALED)) return wrapped(...args);
				const use_reveal = noteInternal.document.getFlag(
					PinCushion.MODULE_NAME,
					PinCushion.FLAGS.USE_PIN_REVEALED
				);
				if (use_reveal === undefined || !use_reveal) {
					// return wrapped(...args);
				} else {
					const value = noteInternal.document.getFlag(
						PinCushion.MODULE_NAME,
						PinCushion.FLAGS.USE_PIN_REVEALED
					);
					if (value !== undefined) {
						const is_linked = noteInternal.entry?.testUserPermission(
							game.user,
							CONST.DOCUMENT_OWNERSHIP_LEVELS.LIMITED
						);
						const colour = game.settings.get(
							PinCushion.MODULE_NAME,
							is_linked ? "revealedNotesTintColorLink" : "revealedNotesTintColorNotLink"
						);
						if (colour?.length > 0) {
							// Temporarily set the icon tint
							const saved = noteInternal.document.texture.tint;
							noteInternal.document.texture.tint = colour;
							// const result = wrapped(...args);
							noteInternal.document.texture.tint = saved;
							// return result;
						}
					}
				}
			}
		}

		let tint = noteInternal.document.texture.tint ? Color.from(noteInternal.document.texture.tint) : null;
		let currentIcon = noteInternal.document.texture.src;
		const pinIsTransparent = noteInternal.document.getFlag(
			PinCushion.MODULE_NAME,
			PinCushion.FLAGS.PIN_IS_TRANSPARENT
		);
		if (String(pinIsTransparent) === "true") {
			currentIcon = CONSTANTS.PATH_TRANSPARENT;
		}

		let iconData = {
			texture: stripQueryStringAndHashFromPath(currentIcon),
			size: noteInternal.size,
			tint: tint,
		};
		let icon;
		// this is note
		if (
			noteInternal.document &&
			noteInternal.document.getFlag(PinCushion.MODULE_NAME, PinCushion.FLAGS.HAS_BACKGROUND)
		) {
			icon = new ControlIcon(iconData);
			icon.x -= this.size / 2;
			icon.y -= this.size / 2;
		} else {
			const enableBackgroundlessPins = game.settings.get(PinCushion.MODULE_NAME, "enableBackgroundlessPins");
			if (enableBackgroundlessPins) {
				icon = new BackgroundlessControlIcon(iconData);
				icon.x -= this.size / 2;
				icon.y -= this.size / 2;
			} else {
				icon = new ControlIcon(iconData);
				icon.x -= this.size / 2;
				icon.y -= this.size / 2;
			}
		}
		if (noteInternal.document.getFlag(PinCushion.MODULE_NAME, PinCushion.FLAGS.RATIO) > 1) {
			if (noteInternal.document) {
				icon.texture.scaleX = noteInternal.document.getFlag(PinCushion.MODULE_NAME, PinCushion.FLAGS.RATIO);
			}
			// else{
			//   icon.texture.scaleX = noteInternal.getFlag(PinCushion.MODULE_NAME,  PinCushion.FLAGS.RATIO); // compatibility 0.8.9
			// }
			// TODO need to centre text
		}
		// PATCH MODULE autoIconFlags
		if (noteInternal.document?.flags?.autoIconFlags) {
			const flagsAutomaticJournalIconNumbers = {
				autoIcon: noteInternal.document?.flags.autoIconFlags.autoIcon,
				iconType: noteInternal.document?.flags.autoIconFlags.iconType,
				iconText: noteInternal.document?.flags.autoIconFlags.iconText,
				foreColor: noteInternal.document?.flags.autoIconFlags.foreColor,
				backColor: noteInternal.document?.flags.autoIconFlags.backColor,
				fontFamily: noteInternal.document?.flags.autoIconFlags.fontFamily,
			};
			if (flagsAutomaticJournalIconNumbers.fontFamily) {
				noteInternal.document.fontFamily = flagsAutomaticJournalIconNumbers.fontFamily;
			}
			//noteInternal.controlIcon?.bg?.fill = flagsAutomaticJournalIconNumbers.backColor;
		}
		icon.x -= noteInternal.size / 2;
		icon.y -= noteInternal.size / 2;
		return icon;
		// } else {
		//   return undefined;
		// }
	}

	/**
	 * Handles draw control icon
	 * @param {*} event
	 */
	static _drawControlIcon(...args) {
		const res = PinCushion._drawControlIconInternal(this);
		/*
        // Above fog feature
        let aboveFogS = String(
        getProperty(this.document, `this.document.flags.${PinCushion.MODULE_NAME}.${PinCushion.FLAGS.ABOVE_FOG}`),
        );
        if (aboveFogS !== 'true' && aboveFogS !== 'false') {
        aboveFogS = 'false';
        }
        const aboveFog = String(aboveFogS) === 'true' ? true : false;
        if(aboveFog){
        setProperty(this,`zIndex`, 300);
        }
        */
		if (res === undefined) {
			// return wrapped(...args);
		} else {
			return res;
		}
	}

	/**
	 * Defines the icon to be drawn for players if enabled.
	 */
	static _onPrepareNoteData(wrapped) {
		wrapped();

		// IF not GM and IF  = enabled then take flag path as note.document.texture.src
		if (!game.user.isGM) {
			if (this.document && this.document.getFlag(PinCushion.MODULE_NAME, PinCushion.FLAGS.PLAYER_ICON_STATE)) {
				this.document.texture.src = stripQueryStringAndHashFromPath(
					this.document.getFlag(PinCushion.MODULE_NAME, PinCushion.FLAGS.PLAYER_ICON_PATH)
				);
			}
		}
	}

	// /**
	//  * Socket handler
	//  *
	//  * @param {object} message - The socket event's content
	//  * @param {string} message.action - The action the socket receiver should take
	//  * @param {Data} [message.document] - The data to be used for Document actions
	//  * @param {string} [message.id] - The ID used to handle promises
	//  * @param {string} userId - The ID of the user emitting the socket event
	//  * @returns {void}
	//  */
	// _onSocket(message, userId) {
	//   const { action, data, id } = message;
	//   const isFirstGM = game.user === game.users.find((u) => u.isGM && u.active);

	//   // Handle resolving or rejecting promises for GM priviliged requests
	//   if (action === 'return') {
	//     const promise = game.pinCushion._requests[message.id];
	//     if (promise) {
	//       delete game.pinCushion._requests[message.id];
	//       if ('error' in message) promise.reject(message.error);
	//       promise.resolve(data);
	//     }
	//     return;
	//   }

	//   if (!isFirstGM) return;

	//   // Create a Journal Entry Folder
	//   if (action === 'createFolder') {
	//     const userName = game.users.get(userId).name;
	//     return Folder.create({ name: userName, type: 'JournalEntry', parent: null, sorting: 'a' })
	//       .then((response) => {
	//         game.socket.emit(
	//           `module.${PinCushion.MODULE_NAME}`,
	//           {
	//             action: 'return',
	//             data: response.document,
	//             id: id,
	//           },
	//           { recipients: [userId] },
	//         );
	//       })
	//       .catch((error) => {
	//         game.socket.emit(`module.${PinCushion.MODULE_NAME}`, {
	//           action: 'return',
	//           error: error,
	//           id: id,
	//         });
	//       });
	//   }
	// }

	static _renderJournalThumbnail(app, html) {
		game.journal.render();
	}

	static _addJournalThumbnail(app, html, data) {
		if (
			(game.user.isGM && game.settings.get(PinCushion.MODULE_NAME, "enableJournalThumbnailForGMs")) ||
			(!game.user.isGM && game.settings.get(PinCushion.MODULE_NAME, "enableJournalThumbnailForPlayers"))
		) {
			app.documents.forEach((j) => {
				const htmlEntry = html.find(`.directory-item.document[data-document-id="${j.id}"]`);
				if (htmlEntry.length !== 1) {
					return;
				}
				// const journalEntryImage = stripQueryStringAndHashFromPath(j.data.img);
				// 	htmlEntry.prepend(`<img class="pin-cushion-thumbnail sidebar-image journal-entry-image" src="${journalEntryImage}" title="${j.name}"
				//   alt='Journal Entry Thumbnail'>`);
				const journalEntryImage = retrieveFirstImageFromJournalId(j.id);
				if (!journalEntryImage) {
					return;
				}
				const thumbnail = $(
					`<img class="pin-cushion-thumbnail sidebar-image journal-entry-image" src="${journalEntryImage}" title="${j.name}" alt='Journal Entry Thumbnail'>`
				);
				switch (game.settings.get(CONSTANTS.MODULE_NAME, "journalThumbnailPosition")) {
					case "right":
						target.append(thumbnail);
						break;
					case "left":
						target.prepend(thumbnail);
						break;
				}
			});
		}
	}

	/**
	 * Sets whether this Note is revealed (visible) to players; overriding the default FoundryVTT rules.
	 * The iconTint/texture.tint will also be set on the Note based on whether there is a link that the player can access.
	 * If this function is never called then the default FoundryVTT visibility rules will apply
	 * @param [NoteData] [notedata] The NoteData whose visibility is to be set (can be used before the Note has been created)
	 * @param {Boolean}  [visible]  pass in true if the Note should be revealed to players
	 */
	static setNoteRevealed(notedata, visible) {
		const revealedNotes = game.settings.get(PinCushion.MODULE_NAME, "revealedNotes");
		if (revealedNotes) {
			visible = getProperty(notedata, `flags.${PinCushion.MODULE_NAME}.${PinCushion.FLAGS.PIN_IS_REVEALED}`);
			if (visible) {
				const FLAG_IS_REVEALED = `flags.${PinCushion.MODULE_NAME}.${PinCushion.FLAGS.PIN_IS_REVEALED}`;
				const FLAG_USE_REVEALED = `flags.${PinCushion.MODULE_NAME}.${PinCushion.FLAGS.USE_PIN_REVEALED}`;
				// notedata might not exist as a Note, so setFlag is not available
				setProperty(notedata, FLAG_USE_REVEALED, true);
				setProperty(notedata, FLAG_IS_REVEALED, visible);
			}
		}
	}
}
