# Pin Cushion

![create-pin](https://github.com/death-save/media/blob/master/pin-cushion/create_pin.png)
![note-config](https://github.com/death-save/media/blob/master/pin-cushion/note-config.png)
![journal-preview](https://github.com/death-save/media/blob/master/pin-cushion/journal-preview.png)

## Features

- Changes the dropdown of map pin icons into a filepicker so users can select any icons they like
- Adds the ability to double-click the canvas while on the Notes Layer and create a map pin (and corresponding Journal Entry)
- Adds a preview of the associated Journal Entry when you hover over a map pin
- Removes the background box from map notes

![img](./img/backgroundless-pins-preview.gif)

- Add the possibility to add a thubnail preview of the journal

![img](./img/journal-thumbnail.png)

- Create map pins that can be used to navigate between scenes. When there is a map note for a journal entry, and that entry is the Scene Notes for a scene, the map note gains a context menu. This menu has options to activate, view, or toggle navigation for that scene.

![img](./img/poi-teleporter.png)

- Additionally, as a convenience feature, there is a new option on the Scene directory context menu, to create the scene notes for a scene in one click

To begin using POI Teleporter, first assign a journal entry as the "Scene Notes" for a scene. You can do this either by editing the scene and selecting the journal entry you would like from the list, or you can right-click on the scene in the directory and choose "Create Scene Notes". You can verify that this has been set correctly by right-clicking the scene in the navigation bar, it should list "Scene Notes" as an option.

Once a scene has notes set to a particular journal entry, you can create a map note from that journal on any scene. This map not is like any other, except that you can now right-click on the note to reveal a context menu with options to show the scene, activate it, or toggle it in the navigation bar.

If you do not see a context menu when you right click on a map note with this module enabled, double check that the map note is the same journal entry as the scene notes for the scene you want to connect to. It must be the same jorunal entry, not a copy, and the journal entry must be set as the scene notes.

## Acknowledgements

- Thank you to [schultzcole](https://github.com/schultzcole) for the module [FVTT-Backgroundless-Pins](https://github.com/schultzcole/FVTT-Backgroundless-Pins) inspiration
- Thank you to [J-Guenther](https://github.com/J-Guenther) for the module [foundryvtt-journal-thumbnail](https://github.com/J-Guenther/foundryvtt-journal-thumbnail) inspiration
- Thank you to [zeel](https://github.com/zeel01) for the module [Point of Interest Teleporter](https://github.com/zeel01/poi-teleport)

## License

- [FVTT-Backgroundless-Pins](https://github.com/schultzcole/FVTT-Backgroundless-Pins) ([GPLv3 License](https://github.com/schultzcole/FVTT-Backgroundless-Pins/blob/master/LICENSE))
- [foundryvtt-journal-thumbnail](https://github.com/J-Guenther/foundryvtt-journal-thumbnail) ([MIT](https://github.com/J-Guenther/foundryvtt-journal-thumbnail/blob/main/LICENSE))
- [Point of Interest Teleporter](https://github.com/zeel01/poi-teleport) ([MIT](https://github.com/zeel01/poi-teleport/blob/master/LICENSE))

This package is under an [GPLv3 License](LICENSE) and the [Foundry Virtual Tabletop Limited License Agreement for module development](https://foundryvtt.com/article/license/).
