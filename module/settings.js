import CONSTANTS from './constants.js';
import { i18n } from './lib/lib.js';

export const registerSettings = function () {
  game.settings.registerMenu(CONSTANTS.MODULE_NAME, 'resetAllSettings', {
    name: `PinCushion.SETTINGS.reset.name`,
    hint: `PinCushion.SETTINGS.reset.hint`,
    icon: 'fas fa-coins',
    type: ResetSettingsDialog,
    restricted: true,
  });

  // game.settings.registerMenu(CONSTANTS.MODULE_NAME, "aboutApp", {
  //     name: game.i18n.localize("PinCushion.SETTINGS.AboutAppN"),
  //     label: game.i18n.localize("PinCushion.SETTINGS.AboutAppN"),
  //     hint: game.i18n.localize("PinCushion.SETTINGS.AboutAppH"),
  //     icon: "fas fa-question",
  //     type: PinCushionAboutApp,
  //     restricted: false
  // });

  game.settings.register(CONSTANTS.MODULE_NAME, 'showJournalPreview', {
    name: game.i18n.localize('PinCushion.SETTINGS.ShowJournalPreviewN'),
    hint: game.i18n.localize('PinCushion.SETTINGS.ShowJournalPreviewH'),
    scope: 'client',
    type: Boolean,
    default: true,
    config: true,
    onChange: (s) => {
      if (!s) {
        delete canvas.hud.pinCushion;
      }

      canvas.hud.render();
    },
  });

  game.settings.register(CONSTANTS.MODULE_NAME, 'previewType', {
    name: game.i18n.localize('PinCushion.SETTINGS.PreviewTypeN'),
    hint: game.i18n.localize('PinCushion.SETTINGS.PreviewTypeH'),
    scope: 'client',
    type: String,
    choices: {
      html: 'HTML',
      text: 'Text Snippet',
    },
    default: 'html',
    config: true,
    onChange: (s) => {},
  });

  game.settings.register(CONSTANTS.MODULE_NAME, 'previewMaxLength', {
    name: game.i18n.localize('PinCushion.SETTINGS.PreviewMaxLengthN'),
    hint: game.i18n.localize('PinCushion.SETTINGS.PreviewMaxLengthH'),
    scope: 'client',
    type: Number,
    default: 500,
    config: true,
    onChange: (s) => {},
  });

  game.settings.register(CONSTANTS.MODULE_NAME, 'previewDelay', {
    name: game.i18n.localize('PinCushion.SETTINGS.PreviewDelayN'),
    hint: game.i18n.localize('PinCushion.SETTINGS.PreviewDelayH'),
    scope: 'client',
    type: Number,
    default: 500,
    config: true,
    onChange: (s) => {},
  });

  game.settings.register(CONSTANTS.MODULE_NAME, 'defaultJournalPermission', {
    name: game.i18n.localize('PinCushion.SETTINGS.DefaultJournalPermissionN'),
    hint: game.i18n.localize('PinCushion.SETTINGS.DefaultJournalPermissionH'),
    scope: 'world',
    type: Number,
    choices: Object.entries(CONST.ENTITY_PERMISSIONS).reduce((acc, [perm, key]) => {
      acc[key] = game.i18n.localize(`PERMISSION.${perm}`);
      return acc;
    }, {}),
    default: 0,
    config: true,
    onChange: (s) => {},
  });

  game.settings.register(CONSTANTS.MODULE_NAME, 'defaultJournalFolder', {
    name: game.i18n.localize('PinCushion.SETTINGS.DefaultJournalFolderN'),
    hint: game.i18n.localize('PinCushion.SETTINGS.DefaultJournalFolderH'),
    scope: 'world',
    type: String,
    choices: {
      none: game.i18n.localize('PinCushion.None'),
      perUser: game.i18n.localize('PinCushion.PerUser'),
      specificFolder: game.i18n.localize('PinCushion.PerSpecificFolder'),
    },
    default: 'none',
    config: true,
    onChange: (s) => {
      // Only run check for folder creation for the main GM
      if (s === 'perUser' && game.user === game.users.find((u) => u.isGM && u.active)) {
        PinCushion._createFolders();
      }
    },
  });

  game.settings.register(CONSTANTS.MODULE_NAME, 'specificFolder', {
    name: game.i18n.localize('PinCushion.SETTINGS.SpecificFolderN'),
    hint: game.i18n.localize('PinCushion.SETTINGS.SpecificFolderH'),
    scope: 'world',
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
  });

  game.settings.register(CONSTANTS.MODULE_NAME, 'enableBackgroundlessPins', {
    name: game.i18n.localize('PinCushion.SETTINGS.EnableBackgroundlessPinsN'),
    hint: game.i18n.localize('PinCushion.SETTINGS.EnableBackgroundlessPinsH'),
    scope: 'world',
    type: Boolean,
    default: false,
    config: true,
  });

  game.settings.register(CONSTANTS.MODULE_NAME, 'showJournalImageByDefault', {
    name: game.i18n.localize('PinCushion.SETTINGS.ShowJournalImageByDefaultN'),
    hint: game.i18n.localize('PinCushion.SETTINGS.ShowJournalImageByDefaultH'),
    scope: 'world',
    type: Boolean,
    default: true,
    config: true,
  });

  game.settings.register(CONSTANTS.MODULE_NAME, 'playerIconAutoOverride', {
    name: game.i18n.localize('PinCushion.SETTINGS.PlayerIconAutoOverrideN'),
    hint: game.i18n.localize('PinCushion.SETTINGS.PlayerIconAutoOverrideH'),
    scope: 'world',
    config: true,
    default: false,
    type: Boolean,
  });

  game.settings.register(CONSTANTS.MODULE_NAME, 'playerIconPathDefault', {
    name: game.i18n.localize('PinCushion.SETTINGS.PlayerIconPathDefaultN'),
    hint: game.i18n.localize('PinCushion.SETTINGS.PlayerIconPathDefaultH'),
    scope: 'world',
    config: true,
    default: 'icons/svg/book.svg',
    type: String,
    filePicker: true,
  });

  game.settings.register(CONSTANTS.MODULE_NAME, 'noteGM', {
    name: game.i18n.localize('PinCushion.SETTINGS.noteGMN'),
    hint: game.i18n.localize('PinCushion.SETTINGS.noteGMH'),
    scope: 'world',
    config: true,
    default: true,
    type: Boolean,
  });

  game.settings.register(CONSTANTS.MODULE_NAME, 'revealedNotes', {
    name: game.i18n.localize('PinCushion.SETTINGS.revealedNotesN'),
    hint: game.i18n.localize('PinCushion.SETTINGS.revealedNotesH'),
    scope: 'world',
    config: true,
    default: false,
    type: Boolean,
  });

  game.settings.register(CONSTANTS.MODULE_NAME, 'revealedNotesTintColorLink', {
    name: game.i18n.localize('PinCushion.SETTINGS.revealedNotesTintColorLinkN'),
    hint: game.i18n.localize('PinCushion.SETTINGS.revealedNotesTintColorLinkH'),
    scope: 'world',
    type: String,
    default: '#7CFC00',
    config: true,
    onChange: () => {
      if (canvas?.ready) {
        canvas.notes.placeables.forEach((note) => note.draw());
        //for (let note of canvas.notes.objects) note.draw();
      }
    },
  });

  game.settings.register(CONSTANTS.MODULE_NAME, 'revealedNotesTintColorNotLink', {
    name: game.i18n.localize('PinCushion.SETTINGS.revealedNotesTintColorNotLinkN'),
    hint: game.i18n.localize('PinCushion.SETTINGS.revealedNotesTintColorNotLinkH'),
    scope: 'world',
    type: String,
    default: '#c000c0',
    config: true,
    onChange: () => {
      if (canvas?.ready) {
        canvas.notes.placeables.forEach((note) => note.draw());
        //for (let note of canvas.notes.objects) note.draw();
      }
    },
  });

  game.settings.register(CONSTANTS.MODULE_NAME, 'enableJournalThumbnailForGMs', {
    name: game.i18n.localize('PinCushion.SETTINGS.enableJournalThumbnailForGMsN'),
    hint: game.i18n.localize('PinCushion.SETTINGS.enableJournalThumbnailForGMsH'),
    scope: 'world',
    type: Boolean,
    default: true,
    config: true,
    onchange: () => window.location.reload(),
  });

  game.settings.register(CONSTANTS.MODULE_NAME, 'enableJournalThumbnailForPlayers', {
    name: game.i18n.localize('PinCushion.SETTINGS.enableJournalThumbnailForPlayersN'),
    hint: game.i18n.localize('PinCushion.SETTINGS.enableJournalThumbnailForPlayersH'),
    scope: 'world',
    type: Boolean,
    default: true,
    config: true,
    onchange: () => window.location.reload(),
  });

  game.settings.register(CONSTANTS.MODULE_NAME, 'fontSize', {
    name: game.i18n.localize('PinCushion.SETTINGS.fontSizeN'),
    hint: game.i18n.localize('PinCushion.SETTINGS.fontSizeH'),
    scope: 'client',
    type: String,
    default: '',
    config: true,
  });

  game.settings.register(CONSTANTS.MODULE_NAME, 'maxWidth', {
    name: game.i18n.localize('PinCushion.SETTINGS.maxWidthN'),
    hint: game.i18n.localize('PinCushion.SETTINGS.maxWidthH'),
    scope: 'client',
    type: Number,
    default: 800,
    config: true,
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
      title: game.i18n.localize(`PinCushion.SETTINGS.dialogs.resetsettings.title`),
      content:
        '<p style="margin-bottom:1rem;">' +
        game.i18n.localize(`PinCushion.SETTINGS.dialogs.resetsettings.content`) +
        '</p>',
      buttons: {
        confirm: {
          icon: '<i class="fas fa-check"></i>',
          label: game.i18n.localize(`PinCushion.SETTINGS.dialogs.resetsettings.confirm`),
          callback: async () => {
            await applyDefaultSettings();
            window.location.reload();
          },
        },
        cancel: {
          icon: '<i class="fas fa-times"></i>',
          label: game.i18n.localize(`PinCushion.SETTINGS.dialogs.resetsettings.cancel`),
        },
      },
      default: 'cancel',
    });
  }
  async _updateObject(event, formData) {
    // do nothing
  }
}
async function applyDefaultSettings() {
  // const settings = defaultSettings(true);
  // for (const [name, data] of Object.entries(settings)) {
  //   await game.settings.set(CONSTANTS.MODULE_NAME, name, data.default);
  // }
  const settings2 = otherSettings(true);
  for (const [name, data] of Object.entries(settings2)) {
    await game.settings.set(CONSTANTS.MODULE_NAME, name, data.default);
  }
}
// function defaultSettings(apply = false) {
//   return {
//     //
//   };
// }
function otherSettings(apply = false) {
  return {
    showJournalPreview: {
      name: game.i18n.localize('PinCushion.SETTINGS.ShowJournalPreviewN'),
      hint: game.i18n.localize('PinCushion.SETTINGS.ShowJournalPreviewH'),
      scope: 'client',
      type: Boolean,
      default: true,
      config: true,
      onChange: (s) => {
        if (!s) {
          delete canvas.hud.pinCushion;
        }

        canvas.hud.render();
      },
    },

    previewType: {
      name: game.i18n.localize('PinCushion.SETTINGS.PreviewTypeN'),
      hint: game.i18n.localize('PinCushion.SETTINGS.PreviewTypeH'),
      scope: 'client',
      type: String,
      choices: {
        html: 'HTML',
        text: 'Text Snippet',
      },
      default: 'html',
      config: true,
      onChange: (s) => {},
    },

    previewMaxLength: {
      name: game.i18n.localize('PinCushion.SETTINGS.PreviewMaxLengthN'),
      hint: game.i18n.localize('PinCushion.SETTINGS.PreviewMaxLengthH'),
      scope: 'client',
      type: Number,
      default: 500,
      config: true,
      onChange: (s) => {},
    },

    previewDelay: {
      name: game.i18n.localize('PinCushion.SETTINGS.PreviewDelayN'),
      hint: game.i18n.localize('PinCushion.SETTINGS.PreviewDelayH'),
      scope: 'client',
      type: Number,
      default: 500,
      config: true,
      onChange: (s) => {},
    },

    defaultJournalPermission: {
      name: game.i18n.localize('PinCushion.SETTINGS.DefaultJournalPermissionN'),
      hint: game.i18n.localize('PinCushion.SETTINGS.DefaultJournalPermissionH'),
      scope: 'world',
      type: Number,
      choices: Object.entries(CONST.ENTITY_PERMISSIONS).reduce((acc, [perm, key]) => {
        acc[key] = game.i18n.localize(`PERMISSION.${perm}`);
        return acc;
      }, {}),
      default: 0,
      config: true,
      onChange: (s) => {},
    },

    defaultJournalFolder: {
      name: game.i18n.localize('PinCushion.SETTINGS.DefaultJournalFolderN'),
      hint: game.i18n.localize('PinCushion.SETTINGS.DefaultJournalFolderH'),
      scope: 'world',
      type: String,
      choices: {
        none: game.i18n.localize('PinCushion.None'),
        perUser: game.i18n.localize('PinCushion.PerUser'),
        specificFolder: game.i18n.localize('PinCushion.PerSpecificFolder'),
      },
      default: 'none',
      config: true,
      onChange: (s) => {
        // Only run check for folder creation for the main GM
        if (s === 'perUser' && game.user === game.users.find((u) => u.isGM && u.active)) {
          PinCushion._createFolders();
        }
      },
    },

    specificFolder: {
      name: game.i18n.localize('PinCushion.SETTINGS.SpecificFolderN'),
      hint: game.i18n.localize('PinCushion.SETTINGS.SpecificFolderH'),
      scope: 'world',
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
      name: game.i18n.localize('PinCushion.SETTINGS.EnableBackgroundlessPinsN'),
      hint: game.i18n.localize('PinCushion.SETTINGS.EnableBackgroundlessPinsH'),
      scope: 'world',
      type: Boolean,
      default: true,
      config: true,
    },

    showJournalImageByDefault: {
      name: game.i18n.localize('PinCushion.SETTINGS.ShowJournalImageByDefaultN'),
      hint: game.i18n.localize('PinCushion.SETTINGS.ShowJournalImageByDefaultH'),
      scope: 'world',
      type: Boolean,
      default: true,
      config: true,
    },

    playerIconAutoOverride: {
      name: game.i18n.localize('PinCushion.SETTINGS.PlayerIconAutoOverrideN'),
      hint: game.i18n.localize('PinCushion.SETTINGS.PlayerIconAutoOverrideH'),
      scope: 'world',
      config: true,
      default: false,
      type: Boolean,
    },

    playerIconPathDefault: {
      name: game.i18n.localize('PinCushion.SETTINGS.PlayerIconPathDefaultN'),
      hint: game.i18n.localize('PinCushion.SETTINGS.PlayerIconPathDefaultH'),
      scope: 'world',
      config: true,
      default: 'icons/svg/book.svg',
      type: String,
      filePicker: true,
    },

    noteGM: {
      name: game.i18n.localize('PinCushion.SETTINGS.noteGMN'),
      hint: game.i18n.localize('PinCushion.SETTINGS.noteGMH'),
      scope: 'world',
      config: true,
      default: true,
      type: Boolean,
    },

    revealedNotes: {
      name: game.i18n.localize('PinCushion.SETTINGS.revealedNotesN'),
      hint: game.i18n.localize('PinCushion.SETTINGS.revealedNotesH'),
      scope: 'world',
      config: true,
      default: false,
      type: Boolean,
    },

    revealedNotesTintColorLink: {
      name: game.i18n.localize('PinCushion.SETTINGS.revealedNotesTintColorLinkN'),
      hint: game.i18n.localize('PinCushion.SETTINGS.revealedNotesTintColorLinkH'),
      scope: 'world',
      type: String,
      default: '#7CFC00',
      config: true,
      onChange: () => {
        if (canvas?.ready) {
          canvas.notes.placeables.forEach((note) => note.draw());
          //for (let note of canvas.notes.objects) note.draw();
        }
      },
    },

    revealedNotesTintColorNotLink: {
      name: game.i18n.localize('PinCushion.SETTINGS.revealedNotesTintColorNotLinkN'),
      hint: game.i18n.localize('PinCushion.SETTINGS.revealedNotesTintColorNotLinkH'),
      scope: 'world',
      type: String,
      default: '#c000c0',
      config: true,
      onChange: () => {
        if (canvas?.ready) {
          canvas.notes.placeables.forEach((note) => note.draw());
          //for (let note of canvas.notes.objects) note.draw();
        }
      },
    },

    enableJournalThumbnailForGMs: {
      name: game.i18n.localize('PinCushion.SETTINGS.enableJournalThumbnailForGMsN'),
      hint: game.i18n.localize('PinCushion.SETTINGS.enableJournalThumbnailForGMsH'),
      scope: 'world',
      type: Boolean,
      default: true,
      config: true,
      onchange: () => window.location.reload(),
    },

    enableJournalThumbnailForPlayers: {
      name: game.i18n.localize('PinCushion.SETTINGS.enableJournalThumbnailForPlayersN'),
      hint: game.i18n.localize('PinCushion.SETTINGS.enableJournalThumbnailForPlayersH'),
      scope: 'world',
      type: Boolean,
      default: true,
      config: true,
      onchange: () => window.location.reload(),
    },

    fontSize: {
      name: game.i18n.localize('PinCushion.SETTINGS.fontSizeN'),
      hint: game.i18n.localize('PinCushion.SETTINGS.fontSizeH'),
      scope: 'client',
      type: String,
      default: '',
      config: true,
    },

    maxWidth: {
      name: game.i18n.localize('PinCushion.SETTINGS.maxWidthN'),
      hint: game.i18n.localize('PinCushion.SETTINGS.maxWidthH'),
      scope: 'client',
      type: Number,
      default: 800,
      config: true,
    },
  };
}
