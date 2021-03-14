import PinCushionAboutApp from "./about.js";
import { libWrapper } from "./lib-wrapper-shim.js";
/**
 * A class for managing additional Map Pin functionality
 * @author Evan Clarke (errational#2007)
 */
class PinCushion {

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
        return {
            content: `<div class="form-group"><p class="notes">Name:</p></label><input name="name" type="text"></div></br>`,
            title: "Create a Map Pin"
        }
    }

    static get NOTESLAYER() {
        return "NotesLayer";
    }

    static get MISSING_NAME() {
        return "Missing Map Pin Name!";
    }

    static get FONT_SIZE() {
        return 16;
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
                    callback: html => {
                        return this.createNoteFromCanvas(html, data);
                    }
                },
                cancel: {
                    label: "Cancel",
                    icon: `<i class="fas fa-times"></i>`,
                    callback: e => {
                        // Maybe do something in the future
                    }
                }
            },
            default: "save"
        }).render(true);
    }

    /**
     * 
     * @param {*} html 
     * @param {*} data 
     */
    async createNoteFromCanvas(html, eventData) {
        const input = html.find("input[name='name']");

        if (!input[0].value) {
            ui.notifications.warn(PinCushion.MISSING_NAME);
            return;
        }
        const entry = await JournalEntry.create({name: `${input[0].value}`});

        if (!entry) {
            return;
        }

        const entryData = entry.data;
        entryData.id = entry.id;
        
        if (canvas.activeLayer.name !== PinCushion.NOTESLAYER) {
            await canvas.notes.activate();
        }

        await canvas.activeLayer._onDropData(eventData, entryData);
    }

    /**
     * Replaces icon selector in Notes Config form with filepicker
     * @param {*} app 
     * @param {*} html 
     * @param {*} data 
     */
    static _replaceIconSelector(app, html, data) {
        const filePickerHtml = 
        `<input type="text" name="icon" title="Icon Path" class="icon-path" value="${data.object.icon}" placeholder="/icons/example.svg" data-dtype="String">
        <button type="button" name="file-picker" class="file-picker" data-type="image" data-target="icon" title="Browse Files" tabindex="-1">
        <i class="fas fa-file-import fa-fw"></i>
        </button>`

        const iconSelector = html.find("select[name='icon']");

        iconSelector.replaceWith(filePickerHtml);

        // Detect and activate file-picker buttons
        html.find('button.file-picker').each((i, button) => app._activateFilePicker(button));
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

        const allowPlayerNotes = game.settings.get(PinCushion.MODULE_NAME, "allowPlayerNotes");

        if (!game.user.isGM && !allowPlayerNotes) return;

        const data = {
            clientX: event.data.global.x,
            clientY: event.data.global.y
        }

        game.pinCushion._createDialog(data);
    }

    /**
     * Handles pressing the delete key
     *
     * @static
     * @param {function} wrapped - The original function
     * @param {Event} event - The triggering event
     */
    static _onDeleteKey(wrapped, event) {
        if (!game.user.isGM && this._hover?.entry.owner && game.settings.get(PinCushion.MODULE_NAME, "allowPlayerNotes")) {
            const note = {id: this._hover.id, scene: this._hover.scene.id};
            return game.socket.emit(`module.${PinCushion.MODULE_NAME}`, {action: "deferNoteDelete", object: note});
        }
        return wrapped(event);
    }

    /**
     * Socket handler
     *
     * @param {object} message - The socket event's content
     * @param {string} userId - The ID of the user emitting the socket event
     * @return {Promise<Data>|boolean} The affected entity or false in case of missing permissions
     */
    _onSocket(message, userId) {
        const {action, object, data, options} = message;
        const isFirstGM = game.user === game.users.find((u) => u.isGM && u.active)
        const scene = game.scenes.get(object.scene)

        // Cancel Note handling if users are not allowed to affect Notes
        if (!game.settings.get(PinCushion.MODULE_NAME, "allowPlayerNotes")) return false;

        if (action === "deferNoteCreate" && isFirstGM) {
            return scene.createEmbeddedEntity("Note", data);
        }

        // The following actions deal with a single Note, so a common instance can be created
        const noteData = scene.data.notes.find(n => n._id === object.id);
        const note = new Note(noteData, scene);
        const userPermission = note.entry.data.permission[userId] >= ENTITY_PERMISSIONS.OWNER;

        // Only handle update if user is the owner of the JournalEntry
        if (isFirstGM && userPermission) {
            if (action === "deferNoteUpdate") {
                return note.update(data, options);
            }

            if (action === "deferNoteDelete") {
                return note.delete();
            }
        }
    }

    /* -------------------------------- Overrides ------------------------------- */

    static _overrideNoteCreate(wrapped, data, options) {
        if (!game.user.isGM && game.settings.get(PinCushion.MODULE_NAME, "allowPlayerNotes")) {
            return game.socket.emit(
                `module.${PinCushion.MODULE_NAME}`,
                {action: "deferNoteCreate", object: {scene: canvas.scene.id}, data: data}
            );
        }
        return wrapped(data, options);
    }

    static _overrideNoteUpdate(wrapped, data) {
        const note = {id: this.id, scene: this.scene.id};
        if (!game.user.isGM && game.settings.get(PinCushion.MODULE_NAME, "allowPlayerNotes")) {
            return game.socket.emit(
                `module.${PinCushion.MODULE_NAME}`,
                {action: "deferNoteUpdate", object: note, data: data, options: options}
            );
        }
        return wrapped(data);
    }

    static _overrideNoteCanConfigue(wrapped, user, event) {
        if (game.settings.get(PinCushion.MODULE_NAME, "allowPlayerNotes") && this.entry?.owner) return true;
        return wrapped(user, event);
    }

    static _overrideNoteCanControl(wrapped, user, event) {
        if (game.settings.get(PinCushion.MODULE_NAME, "allowPlayerNotes") && this.entry?.owner) return true;
        return wrapped(user, event);
    }

    /**
    * Helper function to register settings
    */
    static _registerSettings() {
        game.settings.registerMenu(PinCushion.MODULE_NAME, "aboutApp", {
            name: "SETTINGS.AboutAppN",
            label: "SETTINGS.AboutAppN",
            hint: "SETTINGS.AboutAppH",
            icon: "fas fa-question",
            type: PinCushionAboutApp,
            restricted: false
        });

        game.settings.register(PinCushion.MODULE_NAME, "showJournalPreview", {
            name: "SETTINGS.ShowJournalPreviewN",
            hint: "SETTINGS.ShowJournalPreviewH",
            scope: "client",
            type: Boolean,
            default: false,
            config: true,
            onChange: s => {
                if (!s) {
                    delete canvas.hud.pinCushion;
                }

                canvas.hud.render();
            }
        });

        game.settings.register(PinCushion.MODULE_NAME, "previewType", {
            name: "SETTINGS.PreviewTypeN",
            hint: "SETTINGS.PreviewTypeH",
            scope: "client",
            type: String,
            choices: {
                html: "HTML",
                text: "Text Snippet"
            },
            default: "html",
            config: true,
            onChange: s => {}
        });

        game.settings.register(PinCushion.MODULE_NAME, "previewMaxLength", {
            name: "SETTINGS.PreviewMaxLengthN",
            hint: "SETTINGS.PreviewMaxLengthH",
            scope: "client",
            type: Number,
            default: 500,
            config: true,
            onChange: s => {}
        });

        game.settings.register(PinCushion.MODULE_NAME, "previewDelay", {
            name: "SETTINGS.PreviewDelayN",
            hint: "SETTINGS.PreviewDelayH",
            scope: "client",
            type: Number,
            default: 500,
            config: true,
            onChange: s => {}
        });

        game.settings.register(PinCushion.MODULE_NAME, "allowPlayerNotes", {
            name: "SETTINGS.AllowPlayerNotesN",
            hint: "SETTINGS.AllowPlayerNotesH",
            scope: "world",
            type: Boolean,
            default: false,
            config: true,
            onChange: s => {}
        });
    }
}

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
        const previewType = game.settings.get(PinCushion.MODULE_NAME, "previewType");
        let content;

        if (previewType === "html") {
            content = TextEditor.enrichHTML(entry.data.content, {secrets: entry.owner, entities: true});
        } else if (previewType === "text") {
            const previewMaxLength = game.settings.get(PinCushion.MODULE_NAME, "previewMaxLength");

            const textContent = $(entry.data.content).text();
            content = textContent.length > previewMaxLength ? `${textContent.substr(0, previewMaxLength)} ...` : textContent;
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

/* -------------------------------------------------------------------------- */
/*                                    Hooks                                   */
/* -------------------------------------------------------------------------- */

/**
 * Hook on init
 */
Hooks.on("init", () => {
    globalThis.PinCushion = PinCushion;
    PinCushion._registerSettings();

    // Register overrides to enable creation, configuration, deletion, and movement of Notes by users
    libWrapper.register(PinCushion.MODULE_NAME, "Note.prototype._canConfigure", PinCushion._overrideNoteCanConfigue);
    libWrapper.register(PinCushion.MODULE_NAME, "Note.prototype._canControl", PinCushion._overrideNoteCanControl);
    libWrapper.register(PinCushion.MODULE_NAME, "Note.create", PinCushion._overrideNoteCreate);
    libWrapper.register(PinCushion.MODULE_NAME, "Note.prototype.update", PinCushion._overrideNoteUpdate);
    libWrapper.register(PinCushion.MODULE_NAME, "NotesLayer.prototype._onClickLeft2", PinCushion._onDoubleClick, "OVERRIDE");
    libWrapper.register(PinCushion.MODULE_NAME, "NotesLayer.prototype._onDeleteKey", PinCushion._onDeleteKey);

});

/*
 * Hook on ready
 */
Hooks.on("ready", () => {
    // Wait for game to exist, then register socket handler
    game.socket.on(`module.${PinCushion.MODULE_NAME}`, game.pinCushion._onSocket);
});

/**
 * Hook on note config render to inject filepicker and remove selector
 */
Hooks.on("renderNoteConfig", (app, html, data) => {
    PinCushion._replaceIconSelector(app, html, data);
});

/**
 * Hook on canvas ready to register click listener
 */
Hooks.on("canvasReady", (app, html, data) => {
    game.pinCushion = new PinCushion();
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
        game.pinCushion.hoverTimer = setTimeout(function() { canvas.hud.pinCushion.bind(note) }, previewDelay);
        return;
    }
});

/**
 * Hook on Note preUpdate
 *
 * This is called when a Note is moved. The regular update override does not catch this,
 * since the Scene is the update target, not the Note itself
 */
Hooks.on("preUpdateNote", (scene, noteData, updateData, options, userId) => {
    const user = game.users.get(userId);
    const journalEntry = game.journal.get(noteData.entryId);
    if (!user.isGM && journalEntry.owner) {
        game.socket.emit(`module.${PinCushion.MODULE_NAME}`, {action: "deferNoteUpdate", object: {id: noteData._id, scene: scene.id}, data: updateData});
        return false;
    }
});
