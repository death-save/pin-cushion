
# Details about the new features on the fork from p4535992

This table is a summary of the fixes and features that have been added from the latest official release of Death Save 1.5.0 to the 1.7.0 version p4535992 has managed.

The fork was born on the 2021-08-20 from a request made to me by an acquaintance to fix some bugs on version 9, but afterwards the word spread and I started to put new features that were requested of me with consequent new use cases and bug fixes.

The fork has been tested by several people for almost a year, so I'm confident it's as stable as any module can be.

Apart from the new features, the real big difference is the use of the [jquery-powertip](https://github.com/stevenbenner/jquery-powertip) javascript project, to manage the preview. It also works quite well on mobile and automatically calculates the size of the preview based on the size of the window, so it has many strengths, it does not use the standard foundryvtt library for rendering templates, but after many tests I decided that the solution based on the jQuery library it was much more dynamic at least for foundryvtt version 9.

**NOTE:** If you are interested in the chronological order you can check the releases in the github project.

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

