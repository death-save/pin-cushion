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

    static _canCreateNoteOverride(user, event) {
        return true;
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
     * Socket Handler
     * @param {*} action 
     * @param {*} data 
     */
    _onSocket(message) {
        const { action, object, data } = message;
        if (action === "deferNoteCreate" && game.user.isGM) {
            const note = object;
            return Note.create(data);
        }

        if (action === "deferNoteUpdate" && game.user.isGM) {
            const note = object;
            return note.update(data);
        }
    }

    static _overrideNoteConfigUpdate(event, formData) {
        
        if ( this.object.id ) {
            if (!game.user.isGM) return game.socket.emit(`module.${PinCushion.MODULE_NAME}`, {action: "deferNoteUpdate", object: this, data: formData});
            return this.object.update(formData);
        } else {
            canvas.notes.preview.removeChildren();
            
            return this.object.constructor.create(formData);
        }
    }

    static _overrideNoteCreate(data) {
        if (!game.user.isGM) return game.socket.emit(`module.${PinCushion.MODULE_NAME}`, {action: "deferNoteCreate", object: this, data: data});
        return PlaceableObject.create(data);
    }

    static _overrideNoteUpdate(data) {
        if (!game.user.isGM) return game.socket.emit(`module.${PinCushion.MODULE_NAME}`, {action: "deferNoteCreate", object: this, data: data});
        return super.update(data);
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
    PinCushion._registerSettings();
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

    NotesLayer.prototype._onClickLeft2 = PinCushion._onDoubleClick;
    //NoteConfig.prototype._updateObject = PinCushion._overrideNoteConfigUpdate;
    Note.create = PinCushion._overrideNoteCreate;
    Note.prototype.update = PinCushion._overrideNoteUpdate;
    
    game.socket.on(`module.${PinCushion.MODULE_NAME}`, game.pinCushion._onSocket);
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