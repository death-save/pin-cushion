# Changelog

### [1.6.12]

- Bug fix feature journal image default
- Add image preview of note config

### [1.6.11]

- Bug fix compatibility with Kanka Foundry module

### [1.6.10]

- Bug fix (again) [[BUG] Entry Icon gets overwritten by the Journal Note Image](https://github.com/p4535992/pin-cushion/issues/10)

### [1.6.9]

- Bug fix  [[BUG] Entry Icon gets overwritten by the Journal Note Image](https://github.com/p4535992/pin-cushion/issues/10)

### [1.6.8]

- Add module settings for 'Force to show notes' on token layer

### [1.6.7]

- Some little update

### [1.6.6]

- Some little update

### [1.6.5]

- Bug fix: Add try-catch on BackgroundlessControlIcon for manage use case of not reachable texture on the server, but the journal still work
- Bug fix: For the 'Show image instead text feature', for when no image is found on the linked journal/note and set the enrich html function for interaction
- NEW REQUEST: Add feature for 'Show image instead text feature', with a new file picker field if you have file browser permissions, so you can now add a specific image for the note if you don't want to show the original image on the linked journal, can be useful in some case...
- NEW REQUEST: Add new module setting 'Use mouse position for show the tooltip'.
- Solved (at least for me) the "HEIGHT AND WIDTH BUG" started from 1.6.0 with the new management the tooltip offset position with respect to the note is not static as you would expect it is based on a combination of x, y coordinates which also depend on the zoom level on the canvas, ~~unfortunately it is something that I have not been able to solve, any help in such sense is welcome.~~ On the plus side, the tooltip tends to always show towards the center of the view, perhaps in the mobile environment it is preferable for it to behave this way, so perhaps it is a more benign than evil bug. Waited for some feedback before trying to fix this again.
- Module settings 'noteGM' default set to 'false'
- Bug fix: Some strange behaviour with the 'GM Note' feature, now should work as expected
- NEW FEATURE: Add the feature 'Smart Placement' on the note configuration from the [jquery-powertip](https://github.com/stevenbenner/jquery-powertip) plugin

### [1.6.4]

- Some bug fix on height
- Set the default value of note configuration field `doNotShowJournalPreview` from false to true, for retrocompatibility

### [1.6.3]

- Bug fix for the GM NOte feature

### [1.6.2]

- Add the note configuration setting 'Tooltip Force Remove'

### [1.6.1]

- Removed module setting 'showJournalPreview'
- Removed module setting 'previewType' and put as a new note configuration field 'previewTypeAsTextSnippet'
- Update the module setting 'previewMaxLength' scope from 'client' to 'world'
- Update the module setting 'previewDelay' scope from 'client' to 'world'
- Removed module setting 'enableBackgroundlessPins' we just use on the note configuration field
- Remove method '_registerSettings' from pin cushion on favor of the new design pattern method 'registerSettings'

### [1.6.0]

- Update design pattern, split apps by file
- Add API
- Add integration with SocketLib
- Modify the setting note config `doNotShowJournalPreview` to inlcude even GM not only the players
- Set default value of the module setting `noteGM` to true
- Add module setting `maxWidth`
- Add module setting `fontSize`
- Set default value of the module setting `enableBackgroundlessPins` to true
- Add prettier (sorry death)

### [1.5.16]

- change default value of module setting `showJournalPreview` from false to true
- Add new note config setting `doNotShowJournalPreview` for hide the tooltip preview to players

### [1.5.15]

- Bug fix https://github.com/p4535992/pin-cushion/issues/7

### [1.5.14]

- Bug fix feature "Text Always Visible"

### [1.5.13]

- Add check for "FILES_BROWSE" permission for the file picker for this request [Icon Selector Replacement Options](https://github.com/p4535992/pin-cushion/issues/6)

### [1.5.12]

- Added changelog and conflict

### [1.5.11]

- Abbandoned support for FVTT 0.8.9
- Better journal thumbnail
- Add new module settings 'enableJournalThumbnailForGMs'
- Add new module settings 'enableJournalThumbnailForPlayers'

### [1.5.10]

- Add PR [Foundry 9 Update Compatibility](https://github.com/p4535992/pin-cushion/pull/4) from [PenguinMancer](https://github.com/PenguinMancer) ty to @PenguinMancer

### [1.5.9]

- Bug fix [Fix a null ref for when there was a pin on the map that didn't have an entry](https://github.com/death-save/pin-cushion/pull/78/files)
- Add feature [[FEATURE] Hide Label or Title Text](https://github.com/death-save/pin-cushion/issues/79) add a new option 'Hide Label' to the note configuration dialog
- Clean up:Remove poi of interest template
- Clean up:Remove poi of interest css

### [1.5.8]

- Some bug fix for foundry 9

### [1.5.7]

- Some bug fix for foundry 9

### [1.5.6]

- Added MeusRex Feature from the fork [MeusRex - FVTT-Backgroundless-Pins](https://github.com/MeusRex/FVTT-Backgroundless-Pins): Added Support for Rectangular Notes.
- Added MeusRex Feature from the fork [MeusRex - FVTT-Backgroundless-Pins](https://github.com/MeusRex/FVTT-Backgroundless-Pins): Added option to always show text.
- Sync bug fixing from the fork [Kandashi - FVTT-Backgroundless-Pins](https://github.com/kandashi/FVTT-Backgroundless-Pins) comaptible foundryvtt 9

### [1.5.5]

- Add feature[Add the ability to set a default folder for Pin Cushion JournalEntries](https://github.com/death-save/pin-cushion/issues/74)
- Already patched [[Suggestion] Different icon for players when shared with them](https://github.com/death-save/pin-cushion/issues/59)
- Already patched [[FEATURE] Backgroundless pins](https://github.com/death-save/pin-cushion/issues/55)
- Add feature [Show image instead of text in preview](https://github.com/death-save/pin-cushion/issues/31)


### [1.5.4]

- Start integration for foundryvtt 9
### [1.5.3]

- Removed integration of [Point of Interest Teleporter](https://github.com/zeel01/poi-teleport)' it's work but it seem out of context for the module
- Add feature from [farling42](https://github.com/farling42) and the module [vtt-gmtext-in-notes](https://github.com/farling42/fvtt-gmtext-in-notes) just for not install another module we can enable/disable from settings
- Add feature from [farling42](https://github.com/farling42) and the module [fvtt-revealed-notes-manager](https://github.com/farling42/fvtt-revealed-notes-manager) just for not install another module we can enable/disable from settings
- Some clean up of the project
- Update the github action for build the release

### [1.5.2]

- Embedded integration of the seem abbandoned '[Point of Interest Teleporter](https://github.com/zeel01/poi-teleport)' module
- Add feature to synchronize thumbs of th scene when click on the 'Create Scenes' of the Point of Interest Teleporter new feature

### [1.5.1] - 2021-08-20

- Add updated version of the module [FVTT-Backgroundless-Pins](https://github.com/schultzcole/FVTT-Backgroundless-Pins) integrated for avoid conflict (and because the module is not touched for 10 months)
- Add the setting to automatically updated by default the note image with the journal image if present
- Add updated version of the module [foundryvtt-journal-thumbnail](https://github.com/J-Guenther/foundryvtt-journal-thumbnail) integrated for avoid conflict (and because the module is not touched for 10 months)
- Add module setting created notes for player-only icons enabled based on this pull request [Player journal icons](https://github.com/death-save/pin-cushion/pull/65).


### [1.5.0] - 2021-06-05
- Added compatibility for [Foundry VTT v0.8.6](https://foundryvtt.com/releases/0.8.6) -- thanks @ethaks once again! 🎉
> Due to the massive changes in Foundry v0.8.x the way that Pin Cushion creates Player (Scene) Notes has changed. You now need to set the core permission `Create Map Notes` and the permission `Create Journal Entries`. If the `Create Journal Entries` permission is not set to allow Players to create Journal Entries, then players will receive a message when they try to create a Map Note using double-click. If the `Create Map Notes` permission is not set to allow Players to create Map Notes then no warning will be raised.

### [1.4.0] - 2021-04-18
- You can now set the default permission and folder when creating a Journal Note using Pin Cushion (thanks @saif-ellafi!)
- Images are no longer stretched in the Journal preview (thanks @krysztalzg!)
- Updated 日本語 (Japanese) translation (thanks again @brothersharper and `touge`!)
- Updated Español (Spanish) translation (thanks gain @lozalojo!)

### [1.3.0] - 2021-03-27
- Added a setting to automatically create folders per-user to store Journal Entries that are related to Notes (thanks @ethaks!)
- Added a setting for the default permission to apply to newly created Player Notes (eg. `Observer`, `Limited` etc) (thanks @ethaks!)
- 居酒屋はここにあります -- 日本語 (Japanese) translation added (thanks @brothersharper and `touge`!)

### [1.2.0] - 2021-03-18
- Players can now create Notes on the scene/map! (🎉 thanks @ethaks for this awesome new feature! 🙌)
- - Note: in order to allow Players to create Notes they must have the `Create Journal Entry` permission in the core Foundry permissions. You'll also need to enable `Allow Player Notes` in module settings!
- *¡Aquí hay dragones!* Pin Cushion is now available *en Español* thanks to @lozalojo! 🎊
- When you delete a Note, the Pin Cushion preview is now cleared 🐛
- Fixed a bug that prevented Module settings from registering 🐛
- Added support for [🐛 Bug Reporter](https://github.com/League-of-Foundry-Developers/bug-reporter)

### [1.1.4] - 2020-11-03
### Added
- Confirmed compatibility with Foundry VTT 0.7.5
- About App (accessible from Module Settings)

### [1.1.3] - 2020-10-06
### Added
- Português (Brasil) translation -- thanks @rinnocenti!

### Changed
- Journal Preview text is now left-aligned
- Confirmed compatibility with Foundry VTT 0.7.3

### [1.1.2] - 2020-05-31
### Changed
- Journal Preview settings can now be set by each user
- Confirmed compatibility with Foundry VTT 0.6.1

### [1.1.1] - 2020-05-31
### Changed
- Journal Preview is now disabled by default and has the following settings:
- - Enable
- - Preview Type (HTML or Text Snippet)
- - Max Preview Length (Text Snippet only)
- - Preview Delay

### Fixed
- Journal Previews no longer show secrets to players

### [1.1] - 2020-05-29
### Added
- Journal Preview on Map Pin hover (enable in Module Settings)

### Changed
- Refactored some methods to use more native Foundry functionality

### Fixed
- Double-click to create map pin works again

### [1.0.1] - 2020-04-29
### Changed
- Updated for compatibility with Foundry VTT 0.5.5
- Light refactoring of some code

### [1.0.0] - 2020-03-08
### Added
- Double-click canvas on Notes Layer to create a Journal Entry and Map Pin

### Changed
- Refactored into a class and cleaned up code

### [0.1.0] - 2020-03-07
### Added
- First release. Added the ability to use a filepicker in the Map Pin form to select any file in the user's data.
