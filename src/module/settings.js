import { PinCushion } from "./apps/PinCushion.js";
import CONSTANTS from "./constants.js";
import { i18n } from "./lib/lib.js";

export const registerSettings = function () {
	game.settings.registerMenu(CONSTANTS.MODULE_NAME, "resetAllSettings", {
		name: `pin-cushion.SETTINGS.reset.name`,
		hint: `pin-cushion.SETTINGS.reset.hint`,
		icon: "fas fa-coins",
		type: ResetSettingsDialog,
		restricted: true,
	});

	// game.settings.registerMenu(CONSTANTS.MODULE_NAME, "aboutApp", {
	//     name: game.i18n.localize(`pin-cushion.SETTINGS.AboutAppN"),
	//     label: game.i18n.localize(`pin-cushion.SETTINGS.AboutAppN"),
	//     hint: game.i18n.localize(`pin-cushion.SETTINGS.AboutAppH"),
	//     icon: "fas fa-question",
	//     type: PinCushionAboutApp,
	//     restricted: false
	// });

	// game.settings.register(CONSTANTS.MODULE_NAME, 'showJournalPreview', {
	//   name: game.i18n.localize(`pin-cushion.SETTINGS.ShowJournalPreviewN`),
	//   hint: game.i18n.localize(`pin-cushion.SETTINGS.ShowJournalPreviewH`),
	//   scope: 'client',
	//   type: Boolean,
	//   default: true,
	//   config: true,
	//   onChange: (s) => {
	//     if (!s) {
	//       delete canvas.hud.pinCushion;
	//     }

	//     canvas.hud.render();
	//   },
	// });

	// game.settings.register(CONSTANTS.MODULE_NAME, 'previewType', {
	//   name: game.i18n.localize(`pin-cushion.SETTINGS.PreviewTypeN`),
	//   hint: game.i18n.localize(`pin-cushion.SETTINGS.PreviewTypeH`),
	//   scope: 'client',
	//   type: String,
	//   choices: {
	//     html: 'HTML',
	//     text: 'Text Snippet',
	//   },
	//   default: 'html',
	//   config: true,
	//   onChange: (s) => {},
	// });

	game.settings.register(CONSTANTS.MODULE_NAME, "forceToShowNotes", {
		name: game.i18n.localize(`pin-cushion.SETTINGS.forceToShowNotesN`),
		hint: game.i18n.localize(`pin-cushion.SETTINGS.forceToShowNotesH`),
		scope: "world",
		config: true,
		default: true,
		type: Boolean,
	});

	game.settings.register(CONSTANTS.MODULE_NAME, "previewMaxLength", {
		name: game.i18n.localize(`pin-cushion.SETTINGS.PreviewMaxLengthN`),
		hint: game.i18n.localize(`pin-cushion.SETTINGS.PreviewMaxLengthH`),
		scope: "world",
		type: Number,
		default: 500,
		config: true,
		onChange: (s) => {},
	});

	game.settings.register(CONSTANTS.MODULE_NAME, "previewDelay", {
		name: game.i18n.localize(`pin-cushion.SETTINGS.PreviewDelayN`),
		hint: game.i18n.localize(`pin-cushion.SETTINGS.PreviewDelayH`),
		scope: "world",
		type: Number,
		default: 500,
		config: true,
		onChange: (s) => {},
		//@ts-ignore
		range: { min: 100, max: 3000, step: 100 }, // bug https://github.com/p4535992/foundryvtt-pin-cushion/issues/18
	});

	game.settings.register(CONSTANTS.MODULE_NAME, "defaultJournalPermission", {
		name: game.i18n.localize(`pin-cushion.SETTINGS.DefaultJournalPermissionN`),
		hint: game.i18n.localize(`pin-cushion.SETTINGS.DefaultJournalPermissionH`),
		scope: "world",
		type: Number,
		choices: Object.entries(CONST.DOCUMENT_PERMISSION_LEVELS).reduce((acc, [perm, key]) => {
			acc[key] = game.i18n.localize(`PERMISSION.${perm}`);
			return acc;
		}, {}),
		default: 0,
		config: true,
		onChange: (s) => {},
	});

	game.settings.register(CONSTANTS.MODULE_NAME, "defaultJournalFolder", {
		name: game.i18n.localize(`pin-cushion.SETTINGS.DefaultJournalFolderN`),
		hint: game.i18n.localize(`pin-cushion.SETTINGS.DefaultJournalFolderH`),
		scope: "world",
		type: String,
		choices: {
			none: game.i18n.localize(`pin-cushion.None`),
			perUser: game.i18n.localize(`pin-cushion.PerUser`),
			specificFolder: game.i18n.localize(`pin-cushion.PerSpecificFolder`),
		},
		default: "none",
		config: true,
		onChange: (s) => {
			// Only run check for folder creation for the main GM
			if (s === "perUser" && game.user === game.users.find((u) => u.isGM && u.active)) {
				PinCushion._createFolders();
			}
		},
	});

	game.settings.register(CONSTANTS.MODULE_NAME, "specificFolder", {
		name: game.i18n.localize(`pin-cushion.SETTINGS.SpecificFolderN`),
		hint: game.i18n.localize(`pin-cushion.SETTINGS.SpecificFolderH`),
		scope: "world",
		type: String,
		choices: () => {
			const folders = game.journal.directory.folders.sort((a, b) => a.name.localeCompare(b.name));
			const arr = [];
			return Object.entries(folders).reduce((folder, [k, v]) => {
				folder[v.id] = v.name;
				return folder;
			}, {});
		},
		default: 0,
		config: true,
		onChange: (s) => {},
	});

	game.settings.register(CONSTANTS.MODULE_NAME, "enableBackgroundlessPins", {
		name: game.i18n.localize(`pin-cushion.SETTINGS.EnableBackgroundlessPinsN`),
		hint: game.i18n.localize(`pin-cushion.SETTINGS.EnableBackgroundlessPinsH`),
		scope: "world",
		type: Boolean,
		default: true,
		config: true,
	});

	game.settings.register(CONSTANTS.MODULE_NAME, "showJournalImageByDefault", {
		name: game.i18n.localize(`pin-cushion.SETTINGS.ShowJournalImageByDefaultN`),
		hint: game.i18n.localize(`pin-cushion.SETTINGS.ShowJournalImageByDefaultH`),
		scope: "world",
		type: Boolean,
		default: true,
		config: true,
	});

	game.settings.register(CONSTANTS.MODULE_NAME, "playerIconAutoOverride", {
		name: game.i18n.localize(`pin-cushion.SETTINGS.PlayerIconAutoOverrideN`),
		hint: game.i18n.localize(`pin-cushion.SETTINGS.PlayerIconAutoOverrideH`),
		scope: "world",
		config: true,
		default: false,
		type: Boolean,
	});

	game.settings.register(CONSTANTS.MODULE_NAME, "playerIconPathDefault", {
		name: game.i18n.localize(`pin-cushion.SETTINGS.PlayerIconPathDefaultN`),
		hint: game.i18n.localize(`pin-cushion.SETTINGS.PlayerIconPathDefaultH`),
		scope: "world",
		config: true,
		default: "icons/svg/book.svg",
		type: String,
		filePicker: true,
	});

	game.settings.register(CONSTANTS.MODULE_NAME, "noteGM", {
		name: game.i18n.localize(`pin-cushion.SETTINGS.noteGMN`),
		hint: game.i18n.localize(`pin-cushion.SETTINGS.noteGMH`),
		scope: "world",
		config: true,
		default: false,
		type: Boolean,
	});

	game.settings.register(CONSTANTS.MODULE_NAME, "revealedNotes", {
		name: game.i18n.localize(`pin-cushion.SETTINGS.revealedNotesN`),
		hint: game.i18n.localize(`pin-cushion.SETTINGS.revealedNotesH`),
		scope: "world",
		config: true,
		default: false,
		type: Boolean,
	});

	game.settings.register(CONSTANTS.MODULE_NAME, "revealedNotesTintColorLink", {
		name: game.i18n.localize(`pin-cushion.SETTINGS.revealedNotesTintColorLinkN`),
		hint: game.i18n.localize(`pin-cushion.SETTINGS.revealedNotesTintColorLinkH`),
		scope: "world",
		type: String,
		default: "#7CFC00",
		config: true,
		onChange: () => {
			if (canvas?.ready) {
				canvas.notes.placeables.forEach((note) => note.draw());
				//for (let note of canvas.notes.objects) note.draw();
			}
		},
	});

	game.settings.register(CONSTANTS.MODULE_NAME, "revealedNotesTintColorNotLink", {
		name: game.i18n.localize(`pin-cushion.SETTINGS.revealedNotesTintColorNotLinkN`),
		hint: game.i18n.localize(`pin-cushion.SETTINGS.revealedNotesTintColorNotLinkH`),
		scope: "world",
		type: String,
		default: "#c000c0",
		config: true,
		onChange: () => {
			if (canvas?.ready) {
				canvas.notes.placeables.forEach((note) => note.draw());
				//for (let note of canvas.notes.objects) note.draw();
			}
		},
	});

	game.settings.register(CONSTANTS.MODULE_NAME, "revealedNotesTintColorRevealed", {
		name: game.i18n.localize(`pin-cushion.SETTINGS.revealedNotesTintColorRevealedN`),
		hint: game.i18n.localize(`pin-cushion.SETTINGS.revealedNotesTintColorRevealedH`),
		scope: "world",
		type: String,
		default: "#ffff00",
		config: true,
		onChange: () => refresh(),
	});

	game.settings.register(CONSTANTS.MODULE_NAME, "revealedNotesTintColorNotRevealed", {
		name: game.i18n.localize(`pin-cushion.SETTINGS.revealedNotesTintColorNotRevealedN`),
		hint: game.i18n.localize(`pin-cushion.SETTINGS.revealedNotesTintColorNotRevealedH`),
		scope: "world",
		type: String,
		default: "#ff0000",
		config: true,
		onChange: () => refresh(),
	});

	game.settings.register(CONSTANTS.MODULE_NAME, "enableJournalThumbnailForGMs", {
		name: game.i18n.localize(`pin-cushion.SETTINGS.enableJournalThumbnailForGMsN`),
		hint: game.i18n.localize(`pin-cushion.SETTINGS.enableJournalThumbnailForGMsH`),
		scope: "world",
		type: Boolean,
		default: true,
		config: true,
		onchange: () => window.location.reload(),
	});

	game.settings.register(CONSTANTS.MODULE_NAME, "enableJournalThumbnailForPlayers", {
		name: game.i18n.localize(`pin-cushion.SETTINGS.enableJournalThumbnailForPlayersN`),
		hint: game.i18n.localize(`pin-cushion.SETTINGS.enableJournalThumbnailForPlayersH`),
		scope: "world",
		type: Boolean,
		default: true,
		config: true,
		onchange: () => window.location.reload(),
	});

	game.settings.register(CONSTANTS.MODULE_NAME, "journalThumbnailPosition", {
		name: game.i18n.localize(`pin-cushion.SETTINGS.journalThumbnailPositionN`),
		hint: game.i18n.localize(`pin-cushion.SETTINGS.journalThumbnailPositionH`),
		scope: "world",
		config: true,
		default: "right",
		type: String,
		choices: {
			right: "Right",
			left: "Left",
		},
		onChange: () => game.journal.render(),
	});

	game.settings.register(CONSTANTS.MODULE_NAME, "fontSize", {
		name: game.i18n.localize(`pin-cushion.SETTINGS.fontSizeN`),
		hint: game.i18n.localize(`pin-cushion.SETTINGS.fontSizeH`),
		scope: "client",
		type: String,
		default: "",
		config: true,
	});

	game.settings.register(CONSTANTS.MODULE_NAME, "maxWidth", {
		name: game.i18n.localize(`pin-cushion.SETTINGS.maxWidthN`),
		hint: game.i18n.localize(`pin-cushion.SETTINGS.maxWidthH`),
		scope: "client",
		type: Number,
		default: 800,
		config: true,
	});

	game.settings.register(CONSTANTS.MODULE_NAME, "tooltipUseMousePositionForCoordinates", {
		name: game.i18n.localize(`pin-cushion.SETTINGS.tooltipUseMousePositionForCoordinatesN`),
		hint: game.i18n.localize(`pin-cushion.SETTINGS.tooltipUseMousePositionForCoordinatesH`),
		scope: "world",
		config: true,
		default: true,
		type: Boolean,
	});

	game.settings.register(CONSTANTS.MODULE_NAME, "oneClickNoteCreation", {
		name: game.i18n.localize(`pin-cushion.SETTINGS.oneClickNoteCreationN`),
		hint: game.i18n.localize(`pin-cushion.SETTINGS.oneClickNoteCreationH`),
		scope: "world",
		config: true,
		default: false,
		type: Boolean,
	});

	// const settings = defaultSettings();
	// for (const [name, data] of Object.entries(settings)) {
	//   game.settings.register(CONSTANTS.MODULE_NAME, name, <any>data);
	// }
	for (const [name, data] of Object.entries(otherSettings)) {
		game.settings.register(CONSTANTS.MODULE_NAME, name, data);
	}
};
class ResetSettingsDialog extends FormApplication {
	constructor(...args) {
		//@ts-ignore
		super(...args);
		//@ts-ignore
		return new Dialog({
			title: game.i18n.localize(`pin-cushion.SETTINGS.dialogs.resetsettings.title`),
			content:
				'<p style="margin-bottom:1rem;">' +
				game.i18n.localize(`pin-cushion.SETTINGS.dialogs.resetsettings.content`) +
				"</p>",
			buttons: {
				confirm: {
					icon: '<i class="fas fa-check"></i>',
					label: game.i18n.localize(`pin-cushion.SETTINGS.dialogs.resetsettings.confirm`),
					callback: async () => {
						await applyDefaultSettings();
						window.location.reload();
					},
				},
				cancel: {
					icon: '<i class="fas fa-times"></i>',
					label: game.i18n.localize(`pin-cushion.SETTINGS.dialogs.resetsettings.cancel`),
				},
			},
			default: "cancel",
		});
	}
	async _updateObject(event, formData) {
		// do nothing
	}
}
async function applyDefaultSettings() {
	// const settings = defaultSettings(true);
	// for (const [settingName, settingValue] of Object.entries(settings)) {
	//   await game.settings.set(CONSTANTS.MODULE_NAME, settingName, settingValue.default);
	// }
	const settings2 = otherSettings(true);
	for (const [settingName, settingValue] of Object.entries(settings2)) {
		await game.settings.set(CONSTANTS.MODULE_NAME, settingName, settingValue.default);
	}
}
// function defaultSettings(apply = false) {
//   return {
//     //
//   };
// }
function otherSettings(apply = false) {
	return {
		// showJournalPreview: {
		//   name: game.i18n.localize(`pin-cushion.SETTINGS.ShowJournalPreviewN`),
		//   hint: game.i18n.localize(`pin-cushion.SETTINGS.ShowJournalPreviewH`),
		//   scope: 'client',
		//   type: Boolean,
		//   default: true,
		//   config: true,
		//   onChange: (s) => {
		//     if (!s) {
		//       delete canvas.hud.pinCushion;
		//     }

		//     canvas.hud.render();
		//   },
		// },

		// previewType: {
		//   name: game.i18n.localize(`pin-cushion.SETTINGS.PreviewTypeN`),
		//   hint: game.i18n.localize(`pin-cushion.SETTINGS.PreviewTypeH`),
		//   scope: 'client',
		//   type: String,
		//   choices: {
		//     html: 'HTML',
		//     text: 'Text Snippet',
		//   },
		//   default: 'html',
		//   config: true,
		//   onChange: (s) => {},
		// },

		forceToShowNotes: {
			name: game.i18n.localize(`pin-cushion.SETTINGS.forceToShowNotesN`),
			hint: game.i18n.localize(`pin-cushion.SETTINGS.forceToShowNotesH`),
			scope: "world",
			config: true,
			default: true,
			type: Boolean,
		},

		previewMaxLength: {
			name: game.i18n.localize(`pin-cushion.SETTINGS.PreviewMaxLengthN`),
			hint: game.i18n.localize(`pin-cushion.SETTINGS.PreviewMaxLengthH`),
			scope: "world",
			type: Number,
			default: 500,
			config: true,
			onChange: (s) => {},
		},

		previewDelay: {
			name: game.i18n.localize(`pin-cushion.SETTINGS.PreviewDelayN`),
			hint: game.i18n.localize(`pin-cushion.SETTINGS.PreviewDelayH`),
			scope: "world",
			type: Number,
			default: 500,
			config: true,
			onChange: (s) => {},
			//@ts-ignore
			range: { min: 100, max: 3000, step: 100 }, // bug https://github.com/p4535992/foundryvtt-pin-cushion/issues/18
		},

		defaultJournalPermission: {
			name: game.i18n.localize(`pin-cushion.SETTINGS.DefaultJournalPermissionN`),
			hint: game.i18n.localize(`pin-cushion.SETTINGS.DefaultJournalPermissionH`),
			scope: "world",
			type: Number,
			choices: Object.entries(CONST.DOCUMENT_PERMISSION_LEVELS).reduce((acc, [perm, key]) => {
				acc[key] = game.i18n.localize(`PERMISSION.${perm}`);
				return acc;
			}, {}),
			default: 0,
			config: true,
			onChange: (s) => {},
		},

		defaultJournalFolder: {
			name: game.i18n.localize(`pin-cushion.SETTINGS.DefaultJournalFolderN`),
			hint: game.i18n.localize(`pin-cushion.SETTINGS.DefaultJournalFolderH`),
			scope: "world",
			type: String,
			choices: {
				none: game.i18n.localize(`pin-cushion.None`),
				perUser: game.i18n.localize(`pin-cushion.PerUser`),
				specificFolder: game.i18n.localize(`pin-cushion.PerSpecificFolder`),
			},
			default: "none",
			config: true,
			onChange: (s) => {
				// Only run check for folder creation for the main GM
				if (s === "perUser" && game.user === game.users.find((u) => u.isGM && u.active)) {
					PinCushion._createFolders();
				}
			},
		},

		specificFolder: {
			name: game.i18n.localize(`pin-cushion.SETTINGS.SpecificFolderN`),
			hint: game.i18n.localize(`pin-cushion.SETTINGS.SpecificFolderH`),
			scope: "world",
			type: String,
			choices: () => {
				const folders = game.journal.directory.folders.sort((a, b) => a.name.localeCompare(b.name));
				const arr = [];
				return Object.entries(folders).reduce((folder, [k, v]) => {
					folder[k] = v.name;
					return folder;
				}, {});
			},
			default: 0,
			config: true,
			onChange: (s) => {},
		},

		enableBackgroundlessPins: {
			name: game.i18n.localize(`pin-cushion.SETTINGS.EnableBackgroundlessPinsN`),
			hint: game.i18n.localize(`pin-cushion.SETTINGS.EnableBackgroundlessPinsH`),
			scope: "world",
			type: Boolean,
			default: true,
			config: true,
		},

		showJournalImageByDefault: {
			name: game.i18n.localize(`pin-cushion.SETTINGS.ShowJournalImageByDefaultN`),
			hint: game.i18n.localize(`pin-cushion.SETTINGS.ShowJournalImageByDefaultH`),
			scope: "world",
			type: Boolean,
			default: true,
			config: true,
		},

		playerIconAutoOverride: {
			name: game.i18n.localize(`pin-cushion.SETTINGS.PlayerIconAutoOverrideN`),
			hint: game.i18n.localize(`pin-cushion.SETTINGS.PlayerIconAutoOverrideH`),
			scope: "world",
			config: true,
			default: false,
			type: Boolean,
		},

		playerIconPathDefault: {
			name: game.i18n.localize(`pin-cushion.SETTINGS.PlayerIconPathDefaultN`),
			hint: game.i18n.localize(`pin-cushion.SETTINGS.PlayerIconPathDefaultH`),
			scope: "world",
			config: true,
			default: "icons/svg/book.svg",
			type: String,
			filePicker: true,
		},

		noteGM: {
			name: game.i18n.localize(`pin-cushion.SETTINGS.noteGMN`),
			hint: game.i18n.localize(`pin-cushion.SETTINGS.noteGMH`),
			scope: "world",
			config: true,
			default: true,
			type: Boolean,
		},

		revealedNotes: {
			name: game.i18n.localize(`pin-cushion.SETTINGS.revealedNotesN`),
			hint: game.i18n.localize(`pin-cushion.SETTINGS.revealedNotesH`),
			scope: "world",
			config: true,
			default: false,
			type: Boolean,
		},

		revealedNotesTintColorLink: {
			name: game.i18n.localize(`pin-cushion.SETTINGS.revealedNotesTintColorLinkN`),
			hint: game.i18n.localize(`pin-cushion.SETTINGS.revealedNotesTintColorLinkH`),
			scope: "world",
			type: String,
			default: "#7CFC00",
			config: true,
			onChange: () => {
				if (canvas?.ready) {
					canvas.notes.placeables.forEach((note) => note.draw());
					//for (let note of canvas.notes.objects) note.draw();
				}
			},
		},

		revealedNotesTintColorNotLink: {
			name: game.i18n.localize(`pin-cushion.SETTINGS.revealedNotesTintColorNotLinkN`),
			hint: game.i18n.localize(`pin-cushion.SETTINGS.revealedNotesTintColorNotLinkH`),
			scope: "world",
			type: String,
			default: "#c000c0",
			config: true,
			onChange: () => {
				if (canvas?.ready) {
					canvas.notes.placeables.forEach((note) => note.draw());
					//for (let note of canvas.notes.objects) note.draw();
				}
			},
		},

		revealedNotesTintColorRevealed: {
			name: game.i18n.localize(`pin-cushion.SETTINGS.revealedNotesTintColorRevealedN`),
			hint: game.i18n.localize(`pin-cushion.SETTINGS.revealedNotesTintColorRevealedH`),
			scope: "world",
			type: String,
			default: "#ffff00",
			config: true,
			onChange: () => refresh(),
		},

		revealedNotesTintColorNotRevealed: {
			name: game.i18n.localize(`pin-cushion.SETTINGS.revealedNotesTintColorNotRevealedN`),
			hint: game.i18n.localize(`pin-cushion.SETTINGS.revealedNotesTintColorNotRevealedH`),
			scope: "world",
			type: String,
			default: "#ff0000",
			config: true,
			onChange: () => refresh(),
		},

		enableJournalThumbnailForGMs: {
			name: game.i18n.localize(`pin-cushion.SETTINGS.enableJournalThumbnailForGMsN`),
			hint: game.i18n.localize(`pin-cushion.SETTINGS.enableJournalThumbnailForGMsH`),
			scope: "world",
			type: Boolean,
			default: true,
			config: true,
			onchange: () => window.location.reload(),
		},

		enableJournalThumbnailForPlayers: {
			name: game.i18n.localize(`pin-cushion.SETTINGS.enableJournalThumbnailForPlayersN`),
			hint: game.i18n.localize(`pin-cushion.SETTINGS.enableJournalThumbnailForPlayersH`),
			scope: "world",
			type: Boolean,
			default: true,
			config: true,
			onchange: () => window.location.reload(),
		},

		journalThumbnailPosition: {
			name: game.i18n.localize(`pin-cushion.SETTINGS.journalThumbnailPositionN`),
			hint: game.i18n.localize(`pin-cushion.SETTINGS.journalThumbnailPositionH`),
			scope: "world",
			config: true,
			default: "right",
			type: String,
			choices: {
				right: "Right",
				left: "Left",
			},
			onChange: () => game.journal.render(),
		},

		fontSize: {
			name: game.i18n.localize(`pin-cushion.SETTINGS.fontSizeN`),
			hint: game.i18n.localize(`pin-cushion.SETTINGS.fontSizeH`),
			scope: "client",
			type: String,
			default: "",
			config: true,
		},

		maxWidth: {
			name: game.i18n.localize(`pin-cushion.SETTINGS.maxWidthN`),
			hint: game.i18n.localize(`pin-cushion.SETTINGS.maxWidthH`),
			scope: "client",
			type: Number,
			default: 800,
			config: true,
		},

		tooltipUseMousePositionForCoordinates: {
			name: game.i18n.localize(`pin-cushion.SETTINGS.tooltipUseMousePositionForCoordinatesN`),
			hint: game.i18n.localize(`pin-cushion.SETTINGS.tooltipUseMousePositionForCoordinatesH`),
			scope: "world",
			config: true,
			default: true,
			type: Boolean,
		},

		oneClickNoteCreation: {
			name: game.i18n.localize(`pin-cushion.SETTINGS.oneClickNoteCreationN`),
			hint: game.i18n.localize(`pin-cushion.SETTINGS.oneClickNoteCreationH`),
			scope: "world",
			config: true,
			default: false,
			type: Boolean,
		},
	};
}
