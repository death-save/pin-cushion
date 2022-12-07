import { PinCushion } from "./PinCushion.js";

export async function noteControl(wrapped, ...args) {
	const allowNote = game.settings.get(PinCushion.MODULE_NAME, "allow-note");
	// CHECK IF YOU ARE NOT ON NOTE LAYER
	const noteLayer = canvas.layers.find((layer) => layer.name === "NotesLayer");
	if (noteLayer.active || !game.modules.get("monks-active-tiles")?.active || !allowNote) {
		return wrapped(...args);
	}

	const allowNotePassthrough = game.settings.get(PinCushion.MODULE_NAME, "allow-note-passthrough");
	const preventWhenPaused = game.settings.get(PinCushion.MODULE_NAME, "prevent-when-paused");

	const isRightClick = args[0].type === "rightdown";
	const isLeftClick = args[0].type === "leftdown";

	if (allowNotePassthrough) {
		await new Promise((resolve) => {
			resolve();
		});
	}

	let triggerNote = function (note, options) {
		if (note && allowNote) {
			//check if this is associated with a Tile
			if (note.flags["monks-active-tiles"]?.entity) {
				// if (!!note.flags["monks-active-tiles"][note._notechange]) {
				if (
					(isLeftClick && note.flags["monks-active-tiles"].leftclick) ||
					(isRightClick && note.flags["monks-active-tiles"].rightclick)
				) {
					let entity = note.flags["monks-active-tiles"]?.entity;
					if (typeof entity == "string") entity = JSON.parse(entity || "{}");
					if (entity.id) {
						let notes = [note];

						let doc;
						if (entity.id.startsWith("tagger")) {
							if (game.modules.get("tagger")?.active) {
								let tag = entity.id.substring(7);
								doc = Tagger.getByTag(tag)[0];
							}
						} else {
							let parts = entity.id.split(".");

							const [docName, docId] = parts.slice(0, 2);
							parts = parts.slice(2);
							const collection = CONFIG[docName].collection.instance;
							doc = collection.get(docId);

							while (doc && parts.length > 1) {
								const [embeddedName, embeddedId] = parts.slice(0, 2);
								doc = doc.getEmbeddedDocument(embeddedName, embeddedId);
								parts = parts.slice(2);
							}
						}

						if (doc) {
							let triggerData = doc.flags["monks-active-tiles"];
							if (triggerData && triggerData.active) {
								if (
									preventWhenPaused &&
									game.paused &&
									!game.user.isGM &&
									triggerData.allowpaused !== true
								)
									return;

								//check to see if this trigger is restricted by control type
								if (
									(triggerData.controlled == "gm" && !game.user.isGM) ||
									(triggerData.controlled == "player" && game.user.isGM)
								)
									return;

								let tokens = canvas.tokens.controlled.map((t) => t.document);
								//check to see if this trigger is per token, and already triggered
								if (triggerData.pertoken) {
									tokens = tokens.filter((t) => !doc.hasTriggered(t.id)); //.uuid
									if (tokens.length == 0) return;
								}

								return doc.trigger({
									tokens: tokens,
									method: "note",
									options: {
										notes: notes,
										change: note._notechange,
									},
								});
							}
						}
					}
				}
			}
		}
	};

	let result = wrapped(...args);
	if (result instanceof Promise) {
		return result.then((note) => {
			triggerNote(note);
			delete note._notechange;
		});
	} else {
		triggerNote(this.document);
		delete this.document._notechange;
		return result;
	}
}
