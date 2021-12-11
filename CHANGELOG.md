# Changelog

## [1.5.3]

- Removed integration of [Point of Interest Teleporter](https://github.com/zeel01/poi-teleport)' it's work but it seem out of context for the module
- Add feature from [farling42](https://github.com/farling42) and the module [vtt-gmtext-in-notes](https://github.com/farling42/fvtt-gmtext-in-notes) just for not install another module we can enable/disable from settings
- Add feature from [farling42](https://github.com/farling42) and the module [fvtt-revealed-notes-manager](https://github.com/farling42/fvtt-revealed-notes-manager) just for not install another module we can enable/disable from settings
- Some clean up of the project
- Update the github action for build the release

## [1.5.2]

- Embedded integration of the seem abbandoned '[Point of Interest Teleporter](https://github.com/zeel01/poi-teleport)' module
- Add feature to synchronize thumbs of th scene when click on the 'Create Scenes' of the Point of Interest Teleporter new feature

## [1.5.1] - 2021-08-20

- Add updated version of the module [FVTT-Backgroundless-Pins](https://github.com/schultzcole/FVTT-Backgroundless-Pins) integrated for avoid conflict (and because the module is not touched for 10 months)
- Add the setting to automatically updated by default the note image with the journal image if present
- Add updated version of the module [foundryvtt-journal-thumbnail](https://github.com/J-Guenther/foundryvtt-journal-thumbnail) integrated for avoid conflict (and because the module is not touched for 10 months)
- Add module setting created notes for player-only icons enabled based on this pull request [Player journal icons](https://github.com/death-save/pin-cushion/pull/65).


## [1.5.0] - 2021-06-05
- Added compatibility for [Foundry VTT v0.8.6](https://foundryvtt.com/releases/0.8.6) -- thanks @ethaks once again! 🎉
> Due to the massive changes in Foundry v0.8.x the way that Pin Cushion creates Player (Scene) Notes has changed. You now need to set the core permission `Create Map Notes` and the permission `Create Journal Entries`. If the `Create Journal Entries` permission is not set to allow Players to create Journal Entries, then players will receive a message when they try to create a Map Note using double-click. If the `Create Map Notes` permission is not set to allow Players to create Map Notes then no warning will be raised.

## [1.4.0] - 2021-04-18
- You can now set the default permission and folder when creating a Journal Note using Pin Cushion (thanks @saif-ellafi!)
- Images are no longer stretched in the Journal preview (thanks @krysztalzg!)
- Updated 日本語 (Japanese) translation (thanks again @brothersharper and `touge`!)
- Updated Español (Spanish) translation (thanks gain @lozalojo!)

## [1.3.0] - 2021-03-27
- Added a setting to automatically create folders per-user to store Journal Entries that are related to Notes (thanks @ethaks!)
- Added a setting for the default permission to apply to newly created Player Notes (eg. `Observer`, `Limited` etc) (thanks @ethaks!)
- 居酒屋はここにあります -- 日本語 (Japanese) translation added (thanks @brothersharper and `touge`!)

## [1.2.0] - 2021-03-18
- Players can now create Notes on the scene/map! (🎉 thanks @ethaks for this awesome new feature! 🙌)
- - Note: in order to allow Players to create Notes they must have the `Create Journal Entry` permission in the core Foundry permissions. You'll also need to enable `Allow Player Notes` in module settings!
- *¡Aquí hay dragones!* Pin Cushion is now available *en Español* thanks to @lozalojo! 🎊
- When you delete a Note, the Pin Cushion preview is now cleared 🐛
- Fixed a bug that prevented Module settings from registering 🐛
- Added support for [🐛 Bug Reporter](https://github.com/League-of-Foundry-Developers/bug-reporter)

## [1.1.4] - 2020-11-03
### Added
- Confirmed compatibility with Foundry VTT 0.7.5
- About App (accessible from Module Settings)

## [1.1.3] - 2020-10-06
### Added
- Português (Brasil) translation -- thanks @rinnocenti!

### Changed
- Journal Preview text is now left-aligned
- Confirmed compatibility with Foundry VTT 0.7.3

## [1.1.2] - 2020-05-31
### Changed
- Journal Preview settings can now be set by each user
- Confirmed compatibility with Foundry VTT 0.6.1

## [1.1.1] - 2020-05-31
### Changed
- Journal Preview is now disabled by default and has the following settings:
- - Enable
- - Preview Type (HTML or Text Snippet)
- - Max Preview Length (Text Snippet only)
- - Preview Delay

### Fixed
- Journal Previews no longer show secrets to players

## [1.1] - 2020-05-29
### Added
- Journal Preview on Map Pin hover (enable in Module Settings)

### Changed
- Refactored some methods to use more native Foundry functionality

### Fixed
- Double-click to create map pin works again

## [1.0.1] - 2020-04-29
### Changed
- Updated for compatibility with Foundry VTT 0.5.5
- Light refactoring of some code

## [1.0.0] - 2020-03-08
### Added
- Double-click canvas on Notes Layer to create a Journal Entry and Map Pin

### Changed
- Refactored into a class and cleaned up code

## [0.1.0] - 2020-03-07
### Added
- First release. Added the ability to use a filepicker in the Map Pin form to select any file in the user's data.
