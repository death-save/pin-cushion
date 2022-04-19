export class BackgroundlessControlIcon extends ControlIcon {
  /**
   * Override ControlIcon#draw to remove drawing of the background.
   */
  async draw() {
    // Draw border
    this.border
      .clear()
      .lineStyle(2, this.borderColor, 1.0)
      .drawRoundedRect(...this.rect, 5)
      .endFill();
    this.border.visible = false;

    // Draw icon
    this.icon.texture = this.texture ?? (this.iconSrc ? await loadTexture(this.iconSrc) : "");
    this.icon.width = this.icon.height = this.size;
    this.icon.tint = Number.isNumeric(this.tintColor) ? this.tintColor : 0xffffff;
    return this;
  }
}
