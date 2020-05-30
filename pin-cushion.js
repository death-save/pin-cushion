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
                        this.createNoteFromCanvas(html, data);
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

        const data = {
            clientX: event.data.global.x,
            clientY: event.data.global.y
        }

        game.pinCushion._createDialog(data);
    }
}

class PinCushionHUD extends BasePlaceableHUD {
    constructor(note, options) {
        super(note, options);
        this.data = note;
    }

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

    getData() {
        const data = super.getData();
        const entry = this.object.entry;

        data.title = entry.data.name,
        data.body = $(entry.data.content).text()

        return data;
    }

    setPosition() {
        if (!this.object) return;

        const position = {
            width: 400,
            height: 500,
            left: this.object.x + 100,
            top: this.object.y - 50,
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
    registerSettings();
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
});

Hooks.on("renderHeadsUpDisplay", (app, html, data) => {
    const setting = game.settings.get(PinCushion.MODULE_NAME, "showJournalPreview");

    if (setting) {
        html.append(`<template id="pin-cushion-hud"></template>`);
        canvas.hud.pinCushion = new PinCushionHUD();
    }
});

Hooks.on("hoverNote", (note, hovered) => {
    const setting = game.settings.get(PinCushion.MODULE_NAME, "showJournalPreview");

    if (!setting) {
        return;
    }

    if (!hovered) {
        return canvas.hud.pinCushion.clear();
    }

    if (hovered) {
        return canvas.hud.pinCushion.bind(note);
    }
});

function registerSettings() {
    game.settings.register(PinCushion.MODULE_NAME, "showJournalPreview", {
        name: "SETTINGS.ShowJournalPreviewN",
        hint: "SETTINGS.ShowJournalPreviewH",
        scope: "world",
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
}