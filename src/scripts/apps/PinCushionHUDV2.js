import CONSTANTS from "../constants.js";
import {
	isPlacementVertical,
	is_real_number,
	retrieveFirstImageFromJournalId,
	retrieveFirstTextFromJournalId,
} from "../lib/lib.js";
import { PinCushion } from "./PinCushion.js";

/**
 * @class PinCushionHUD
 *
 * A HUD extension that shows the Note preview
 */
export class PinCushionHUDV2 extends BasePlaceableHUD {
	// contentTooltip;

	constructor(note, options) {
		super(note, options);
		this.data = note;
	}

	/**
	 * Assign the default options which are supported by the entity edit sheet
	 * @type {Object}
	 */
	static get defaultOptions() {
		return mergeObject(super.defaultOptions, {
			id: "pin-cushion-hud",
			classes: [...super.defaultOptions.classes, "pin-cushion-hud"],
			// width: 400,
			// height: 200,
			minimizable: false,
			resizable: false,
			template: "modules/pin-cushion/templates/journal-preview.html",
		});
	}

	/**
	 * Binds an entity to the HUD
	 *
	 * The note is stored,
	 * and the note associated with it is bound.
	 *
	 * @override
	 * @param {Object} note
	 * @memberof PinCushionHUDV2
	 */
     bind(note) {
		this.note = note;
		super.bind(note);
	}

	/**
	 * Get data for template
	 */
	getData() {
		const data = super.getData();
		const entry = this.object.entry;
		let entryName = data.text;
		let entryIsOwner = true;
		let entryId = undefined;
		let entryIcon = data.texture?.src;
		let entryContent = data.text;
		if (entry) {
			entryName = entry.name;
			entryId = entry.id;
			entryIsOwner = entry.isOwner ?? true;
			entryIcon = retrieveFirstImageFromJournalId(entryId, this.object.page?.id, false);
			if (!entryIcon && data.icon) {
				entryIcon = data.icon;
			}
			entryContent = retrieveFirstTextFromJournalId(entryId, this.object.page?.id, false);
			if (!entryContent && data.text) {
				entryContent = data.text;
			}
		}
		// TODO The getFlag was returning as 'not a function', for whatever reason...
		// const showImage = this.object.getFlag(PinCushion.MODULE_NAME, PinCushion.FLAGS.SHOW_IMAGE);
		const showImage = getProperty(this.object.document.flags[PinCushion.MODULE_NAME], PinCushion.FLAGS.SHOW_IMAGE);
		const showImageExplicitSource = getProperty(
			this.object.document.flags[PinCushion.MODULE_NAME],
			PinCushion.FLAGS.SHOW_IMAGE_EXPLICIT_SOURCE
		);

		let content;
		if (showImage) {
			const imgToShow = showImageExplicitSource ? showImageExplicitSource : entryIcon;
			if (imgToShow && imgToShow.length > 0) {
				content = TextEditor.enrichHTML(`<img class='image' src='${imgToShow}' alt=''></img>`, {
					secrets: entryIsOwner,
					documents: true,
					async: false,
				});
			} else {
				content = TextEditor.enrichHTML(
					`<img class='image' src='${CONSTANTS.PATH_TRANSPARENT}' alt=''></img>`,
					{
						secrets: entryIsOwner,
						documents: true,
						async: false,
					}
				);
			}
		} else {
			const previewTypeAdText = getProperty(
				this.object.document.flags[PinCushion.MODULE_NAME],
				PinCushion.FLAGS.PREVIEW_AS_TEXT_SNIPPET
			);
			const firstContent = entryContent;
			if (!previewTypeAdText) {
				content = TextEditor.enrichHTML(firstContent, {
					secrets: entryIsOwner,
					documents: true,
					async: false,
				});
			} else {
				const previewMaxLength = game.settings.get(PinCushion.MODULE_NAME, "previewMaxLength");
				const textContent = $(firstContent).text();
				content =
					textContent.length > previewMaxLength
						? `${textContent.substr(0, previewMaxLength)} ...`
						: textContent;
			}
		}

		let titleTooltip = entryName; // by default is the title of the journal
		const newtextGM = getProperty(this.object.document.flags[PinCushion.MODULE_NAME], PinCushion.FLAGS.PIN_GM_TEXT);
		if (game.user.isGM && game.settings.get(PinCushion.MODULE_NAME, "noteGM") && newtextGM) {
			titleTooltip = newtextGM;
		} else if (data.text && data.text !== titleTooltip) {
			titleTooltip = data.text;
		}

		let bodyPlaceHolder = `<img class='image' src='${CONSTANTS.PATH_TRANSPARENT}' alt=''></img>`;

		data.tooltipId = this.object.id;
		data.title = titleTooltip;
		// data.body = content;
		data.body = bodyPlaceHolder;

		const fontSize = game.settings.get(CONSTANTS.MODULE_NAME, "fontSize") || canvas.grid.size / 5;
		const maxWidth = game.settings.get(CONSTANTS.MODULE_NAME, "maxWidth") || 400;

		this.contentTooltip = `

          <div id="container" class="pin-cushion-hud-container" style="font-size:${fontSize}px; max-width:${maxWidth}px">
              <div id="header">
                  <h3>${titleTooltip}</h3>
              </div>
              <hr/>
              <div id="content">
                ${content}
              </div>
          </div>

      `;
		return data;
	}

	/**
	 * Set app position
	 */
	setPosition() {
		// {left, top, width, height, scale}={}){
		if (!this.object) {
			return;
		}

		// WITH TOOLTIP
		let x = 0;
		let y = 0;
		if (game.settings.get(PinCushion.MODULE_NAME, "tooltipUseMousePositionForCoordinates")) {
			const positionMouse = canvas.app.renderer.plugins.interaction.mouse.getLocalPosition(canvas.app.stage);
			x = positionMouse.x;
			y = positionMouse.y;
		} else {
			x = this.object.center ? this.object.center.x : this.object.x;
			y = this.object.center ? this.object.center.y : this.object.y;
		}

		const position = {
			left: x,
			top: y
		};
		this.element.css(position);
	}

	/**
	 * Activate any event listenders on the HUD
	 *
	 * Activates a click listener to prevent propagation,
	 * as activates click listeners for all menu options.
	 *
	 * Each option has its own handler, stored in its data-trigger.
	 *
	 * @override
	 * @param {jquery} html - The html of the HUD
	 * @memberof PinCushionHUDV2
	 */
     activateListeners(html) {
		super.activateListeners(html);
		html.click(e => e.stopPropagation());
		html.find("[data-trigger]")
			.click((event) => this.poitp[event.currentTarget.dataset.trigger](event));

		// const elementToTooltip = html;
		let elementToTooltip = this.element;
		// let mouseOnDiv = html; // this.element; // this.element.parent()[0];
		if (!elementToTooltip.document) {
			elementToTooltip = $(elementToTooltip);
		}

		const tooltipPlacement =
			getProperty(this.object.document.flags[PinCushion.MODULE_NAME], PinCushion.FLAGS.TOOLTIP_PLACEMENT) ?? "e";

		const tooltipSmartPlacement =
			getProperty(this.object.document.flags[PinCushion.MODULE_NAME], PinCushion.FLAGS.TOOLTIP_SMART_PLACEMENT) ??
			false;

		const tooltipFollowMouse =
			getProperty(this.object.document.flags[PinCushion.MODULE_NAME], PinCushion.FLAGS.TOOLTIP_FOLLOW_MOUSE) ??
			false;

		const tooltipColor =
			getProperty(this.object.document.flags[PinCushion.MODULE_NAME], PinCushion.FLAGS.TOOLTIP_COLOR) ?? "";

		// WITH TOOLTIP
		let x = 0;
		let y = 0;
		if (game.settings.get(PinCushion.MODULE_NAME, "tooltipUseMousePositionForCoordinates")) {
			const positionMouse = canvas.app.renderer.plugins.interaction.mouse.getLocalPosition(canvas.app.stage);
			x = positionMouse.x;
			y = positionMouse.y;
		} else {
			x = this.object.center ? this.object.center.x : this.object.x;
			y = this.object.center ? this.object.center.y : this.object.y;
		}

		// $.powerTip.hide(html);

		// let popupId = tooltipColor ? 'powerTip-'+tooltipColor : 'powerTip';
		const tooltipPopupClass = tooltipColor
			? "pin-cushion-hud-tooltip-" + tooltipColor
			: "pin-cushion-hud-tooltip-default";

		const tooltipTipContent = $(this.contentTooltip);

		elementToTooltip.data("powertipjq", tooltipTipContent);

		// if (tooltipFollowMouse) {
		//   elementToTooltip.powerTip({
		//     popupClass: tooltipPopupClass,
		//     followMouse: true,
		//   });
		// } else {
		elementToTooltip.powerTip({
			// 	(default: 'powerTip') HTML id attribute for the tooltip div.
			// popupId: popupId, // e.g. default 'powerTip'

			// (default: 'n') Placement location of the tooltip relative to the element it is open for.
			// Values can be n, e, s, w, nw, ne, sw, se, nw-alt, ne-alt, sw-alt,
			// or se-alt (as in north, east, south, and west).
			// This only matters if followMouse is set to false.
			placement: tooltipPlacement,

			// (default: false) When enabled the plugin will try to keep tips inside the browser viewport.
			// If a tooltip would extend outside of the viewport then its placement will be changed to an
			// orientation that would be entirely within the current viewport.
			// Only applies if followMouse is set to false.
			smartPlacement: tooltipSmartPlacement,

			// (default: false) Allow the mouse to hover on the tooltip.
			// This lets users interact with the content in the tooltip.
			// Only applies if followMouse is set to false and manual is set to false.
			mouseOnToPopup: true,

			// (default: false) If set to true the tooltip will follow the user’s mouse cursor.
			// Note that if a tooltip with followMouse enabled is opened by an event without
			// mouse data (like “focus” via keyboard navigation) then it will revert to static
			// placement with smart positioning enabled. So you may wish to set placement as well.
			followMouse: false,

			// (default: '') Space separated custom HTML classes for the tooltip div.
			// Since this plugs directly into jQuery’s addClass() method it will
			// also accept a function that returns a string.
			popupClass: tooltipPopupClass,

			// (default: 10) Pixel offset of the tooltip.
			// This will be the offset from the element the tooltip is open for, or
			// from the mouse cursor if followMouse is true.
			offset: 10,

			// (default: 100) Time in milliseconds to wait after mouse cursor leaves
			// the element before closing the tooltip. This serves two purposes: first,
			// it is the mechanism that lets the mouse cursor reach the tooltip
			// (cross the gap between the element and the tooltip div) for mouseOnToPopup tooltips.
			// And, second, it lets the cursor briefly leave the element and return without causing
			// the whole fade-out, intent test, and fade-in cycle to happen.
			closeDelay: 0,

			// (default: 100) Hover intent polling interval in milliseconds.
			intentPollInterval: 0,
		});
		// }
		$.powerTip.show(elementToTooltip);
	}

	// clear(){
	//   let mouseOnDiv = this.element; // this.element.parent()[0];
	//   if(!mouseOnDiv.data){
	//     mouseOnDiv = $(mouseOnDiv);
	//   }
	//   $.powerTip.hide(mouseOnDiv);
	// }
}
