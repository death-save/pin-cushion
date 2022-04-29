import CONSTANTS from '../constants.js';
import { is_real_number } from '../lib/lib.js';

/**
 * @class PinCushionHUD
 *
 * A HUD extension that shows the Note preview
 */
export class PinCushionHUD extends BasePlaceableHUD {
  // contentTooltip;

  constructor(note, options) {
    super(note, options);
    this.data = note;
  }

  /**
   * Retrieve and override default options for this application
   */
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      id: 'pin-cushion-hud',
      classes: [...super.defaultOptions.classes, 'pin-cushion-hud'],
      // width: 400,
      // height: 200,
      minimizable: false,
      resizable: false,
      template: 'modules/pin-cushion/templates/journal-preview.html',
    });
  }

  /**
   * Get data for template
   */
  getData() {
    const data = super.getData();
    const entry = this.object.entry;
    if (!entry) {
      // Do nothing b/c this doesn't have an entry
      return;
    }
    // TODO The getFlag was returning as 'not a function', for whatever reason...
    // const showImage = this.object.getFlag(PinCushion.MODULE_NAME, PinCushion.FLAGS.SHOW_IMAGE);
    const showImage = getProperty(this.object.data.flags[PinCushion.MODULE_NAME], PinCushion.FLAGS.SHOW_IMAGE);
    const showImageExplicitSource = getProperty(
      this.object.data.flags[PinCushion.MODULE_NAME],
      PinCushion.FLAGS.SHOW_IMAGE_EXPLICIT_SOURCE,
    );

    let content;
    if (showImage) {
      const imgToShow = showImageExplicitSource ? showImageExplicitSource : entry.data.img;
      if (imgToShow && imgToShow.length > 0) {
        content = TextEditor.enrichHTML(`<img class='image' src='${imgToShow}' alt=''></img>`, {
          secrets: entry.isOwner,
          documents: true,
        });
      } else {
        content = TextEditor.enrichHTML(`<img class='image' src='${CONSTANTS.PATH_TRANSPARENT}' alt=''></img>`, {
          secrets: entry.isOwner,
          documents: true,
        });
      }
    } else {
      const previewTypeAdText = getProperty(
        this.object.data.flags[PinCushion.MODULE_NAME],
        PinCushion.FLAGS.PREVIEW_AS_TEXT_SNIPPET,
      );
      if (!previewTypeAdText) {
        content = TextEditor.enrichHTML(entry.data.content, { secrets: entry.isOwner, documents: true });
      } else {
        const previewMaxLength = game.settings.get(PinCushion.MODULE_NAME, 'previewMaxLength');
        const textContent = $(entry.data.content).text();
        content =
          textContent.length > previewMaxLength ? `${textContent.substr(0, previewMaxLength)} ...` : textContent;
      }
    }

    let bodyPlaceHolder = `<img class='image' src='${CONSTANTS.PATH_TRANSPARENT}' alt=''></img>`;

    data.tooltipId = this.object.id;
    data.title = entry.data.name;
    // data.body = content;
    data.body = bodyPlaceHolder;

    const fontSize = game.settings.get(CONSTANTS.MODULE_NAME, 'fontSize') || canvas.grid.size / 5;
    const maxWidth = game.settings.get(CONSTANTS.MODULE_NAME, 'maxWidth') || 400;

    this.contentTooltip = `

          <div id="container" class="pin-cushion-hud-container" style="font-size:${fontSize}px; max-width:${maxWidth}px">
              <div id="header">
                  <h3>${entry.data.name}</h3>
              </div>
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
    if (!this.object) return;

    const fontSize = game.settings.get(CONSTANTS.MODULE_NAME, 'fontSize') || canvas.grid.size / 5;
    const maxWidth = game.settings.get(CONSTANTS.MODULE_NAME, 'maxWidth');

    const tooltipPlacement =
      getProperty(this.object.data.flags[PinCushion.MODULE_NAME], PinCushion.FLAGS.TOOLTIP_PLACEMENT) ?? 'w';

    let orientation = '';
    if (tooltipPlacement.includes('e')) {
      orientation = 'right';
    } else {
      orientation = 'left';
    }

    // WITH TOOLTIP
    let x = 0;
    let y = 0;
    if (game.settings.get(PinCushion.MODULE_NAME, 'tooltipUseMousePositionForCoordinates')) {
      const positionMouse = canvas.app.renderer.plugins.interaction.mouse.getLocalPosition(canvas.app.stage);
      x = positionMouse.x;
      y = positionMouse.y;
    } else {
      x = this.object.x || this.object.center.x;
      y = this.object.y || this.object.center.y;
    }

    // const ratio =
    //   (is_real_number(this.object.data.flags[PinCushion.MODULE_NAME].ratio) &&
    //   this.object.data.flags[PinCushion.MODULE_NAME].ratio > 0
    //     ? this.object.data.flags[PinCushion.MODULE_NAME].ratio
    //     : 1) || 1;
    const ratio = 1;

    const viewWidth = visualViewport.width;
    const width = this.object.controlIcon.width * ratio;
    // const height = this.object.controlIcon.texture?.height
    //   ? this.object.controlIcon.texture?.height - this.object.tooltip.height
    //   : this.object.controlIcon.height - this.object.tooltip.height;
    const height = this.object.controlIcon.height - this.object.tooltip.height;
    // const left = x - this.object.size; // x - this.object.size / 2
    // const top = y - this.object.size / 2;
    const left = x - (this.object.data?.iconSize / 2 || 0); // orientation === "right" ? x - width : x + width;
    const top = y - height / 2;

    // const orientation =
    //   (this.object.getGlobalPosition()?.x ?? 0) < viewWidth / 2 ? "right" : "left";
    // const top = y - height / 2;
    // const left = orientation === "right" ? x + width : x - width;

    /*
    const width = this.object.size * ratio; //this.object.width * ratio;
    const height = this.object.height - this.object.tooltip.height;  // this.object.size;
    const left = x - this.object.size/2;  // - this.object.width/2 + offset,
    const top = y - this.object.size/2; // - this.object.height/2 + offset
    */
    const position = {
      height: height + 'px',
      width: width + 'px',
      left: left + 'px',
      top: top + 'px',
      'font-size': fontSize + 'px',
      'max-width': maxWidth + 'px',
    };
    this.element.css(position);
  }

  activateListeners(html) {
    super.activateListeners(html);

    // const elementToTooltip = html;
    const elementToTooltip = this.element;
    // let mouseOnDiv = html; // this.element; // this.element.parent()[0];
    if (!elementToTooltip.data) {
      elementToTooltip = $(elementToTooltip);
    }

    const fontSize = game.settings.get(CONSTANTS.MODULE_NAME, 'fontSize') || canvas.grid.size / 5;
    const maxWidth = game.settings.get(CONSTANTS.MODULE_NAME, 'maxWidth');

    const tooltipPlacement =
      getProperty(this.object.data.flags[PinCushion.MODULE_NAME], PinCushion.FLAGS.TOOLTIP_PLACEMENT) ?? 'w';
    let orientation = '';
    if (tooltipPlacement.includes('e')) {
      orientation = 'right';
    } else {
      orientation = 'left';
    }

    const tooltipColor =
      getProperty(this.object.data.flags[PinCushion.MODULE_NAME], PinCushion.FLAGS.TOOLTIP_COLOR) ?? '';

    // WITH TOOLTIP
    let x = 0;
    let y = 0;
    if (game.settings.get(PinCushion.MODULE_NAME, 'tooltipUseMousePositionForCoordinates')) {
      const positionMouse = canvas.app.renderer.plugins.interaction.mouse.getLocalPosition(canvas.app.stage);
      x = positionMouse.x;
      y = positionMouse.y;
    } else {
      x = this.object.x || this.object.center.x;
      y = this.object.y || this.object.center.y;
    }

    // const ratio =
    //   (is_real_number(this.object.data.flags[PinCushion.MODULE_NAME].ratio) &&
    //   this.object.data.flags[PinCushion.MODULE_NAME].ratio > 0
    //     ? this.object.data.flags[PinCushion.MODULE_NAME].ratio
    //     : 1) || 1;
    const ratio = 1;

    const viewWidth = visualViewport.width;
    const width = this.object.controlIcon.width * ratio;
    // const height = this.object.controlIcon.texture?.height
    //   ? this.object.controlIcon.texture?.height - this.object.tooltip.height
    //   : this.object.controlIcon.height - this.object.tooltip.height;
    const height = this.object.controlIcon.height - this.object.tooltip.height;
    // const left = x - this.object.size; //  this.object.size / 2;
    // const top = y - this.object.size / 2;
    const left = x - (this.object.data?.iconSize / 2 || 0); // orientation === "right" ? x - width : x + width;
    const top = y - height / 2;

    // const orientation =
    //   (this.object.getGlobalPosition()?.x ?? 0) < viewWidth / 2 ? "right" : "left";
    // const top = y - height / 2;
    // const left = orientation === "right" ? x + width : x - width;

    /*
    const width = this.object.size * ratio; //this.object.width * ratio;
    const height = this.object.height - this.object.tooltip.height; // this.object.size;
    const left = x - this.object.size/2;  // - this.object.width/2 + offset,
    const top = y - this.object.size/2; // - this.object.height/2 + offset
    */

    const position = {
      height: height + 'px',
      width: width + 'px',
      left: left + 'px',
      top: top + 'px',
    };
    elementToTooltip.css(position);

    // $.powerTip.hide(html);

    // let popupId = tooltipColor ? 'powerTip-'+tooltipColor : 'powerTip';
    let popupClass = tooltipColor ? 'pin-cushion-hud-tooltip-' + tooltipColor : 'pin-cushion-hud-tooltip-default';

    let tipContent = $(this.contentTooltip);

    elementToTooltip.data('powertipjq', tipContent);
    elementToTooltip.powerTip({
      // popupId: popupId, // e.g. default 'powerTip'

      // Values can be n, e, s, w, nw, ne, sw, se, nw-alt, ne-alt, sw-alt, or se-alt (as in north, east, south, and west).
      // This only matters if followMouse is set to false.
      placement: tooltipPlacement,

      // Boolean Allow the mouse to hover on the tooltip. This lets users interact with the content in the tooltip. Only works if followMouse is set to false.
      mouseOnToPopup: true,

      // Boolean If set to true the tooltip will follow the users mouse cursor.
      // followMouse: false, // TODO ADD A NOTE CONFIG SETTING MAYBE ???

      popupClass: popupClass,

      // Number  Pixel offset of the tooltip. This will be the offset from the element the tooltip is open for, or from from mouse cursor if followMouse is true.
      offset: 10,

      // Time in milliseconds to wait after mouse cursor leaves the element before closing the tooltip.
      // This serves two purposes: first, it is the mechanism that lets the mouse cursor reach the tooltip (cross the gap between the element and the tooltip div) for mouseOnToPopup tooltips.

      // And, second, it lets the cursor briefly leave the element and return without causing the whole fade-out, intent test, and fade-in cycle to happen.
      closeDelay: 0,

      // Hover intent polling interval in milliseconds.
      intentPollInterval: 0,
    });

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
