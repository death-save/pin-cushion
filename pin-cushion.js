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

    /* --------------------------------- Methods -------------------------------- */
    
    /**
     * Register listeners
     */
    registerListeners() {
        canvas.stage.on("click", event => this._onClickCanvas(event));
    }

    /**
     * Creates and renders a dialog for name entry
     * @param {*} data 
     */
    _createDialog(data) {
        const dialogData = data;

        new Dialog({
            title: PinCushion.DIALOG.title,
            content: PinCushion.DIALOG.content,
            buttons: {
                save: {
                    label: "Save",
                    icon: `<i class="fas fa-check"></i>`,
                    callback: async html => {
                        const input = html.find("input[name='name']");
                        if(input[0].value) {
                            const entry = await JournalEntry.create({name: `${input[0].value}`});

                            // Create Note data
                            const data = {
                                entryId: entry.data._id,
                                x: dialogData.x,
                                y: dialogData.y,
                                icon: CONST.DEFAULT_NOTE_ICON,
                                iconSize: 40,
                                textAnchor: CONST.TEXT_ANCHOR_POINTS.BOTTOM,
                                fontSize: 48
                            };
                        
                            // Validate the final position is in-bounds
                            if ( !canvas.grid.hitArea.contains(data.x, data.y) ) {
                                return;
                            }
                        
                            // Create a NoteConfig sheet instance to finalize the creation
                            const note = canvas.activeLayer.preview.addChild(new Note(data).draw());
                            note.sheet.render(true);
                        }
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
     * Handles canvas clicks
     */
    _onClickCanvas(event) {
        const now = Date.now();
    
        if (canvas.activeLayer.name !== "NotesLayer" || canvas.activeLayer._hover) {
            return;
        }
        
        // If the click is less than 250ms since the last clicktime, it should be a doubleclick
        if ((now - event.data.clickTime) < 250) {
            this._onDoubleClick(event);
        }
        // Set clickTime to enable doubleclick detection
        event.data.clickTime = now;
    }
    
    /**
     * Handles doubleclicks
     * @param {*} event 
     */
    _onDoubleClick(event) {
        const data = {
            x: event.data.destination.x,
            y: event.data.destination.y
        }

        this._createDialog(data);
    }
}

/* -------------------------------------------------------------------------- */
/*                                    Hooks                                   */
/* -------------------------------------------------------------------------- */

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
    const pinCushion = new PinCushion();

    pinCushion.registerListeners();
});