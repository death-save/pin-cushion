import { error, warn } from "../lib/lib.js";

export class BackgroundlessControlIcon extends ControlIcon {
	/**
	 * Override ControlIcon#draw to remove drawing of the background.
	 */
	async draw() {
		// Load the icon texture
		this.texture = this.texture ?? (await loadTexture(this.iconSrc));

		// Don't draw a destroyed Control
		if (this.destroyed) return this;

		// Draw border
		this.border
			.clear()
			.lineStyle(2, this.borderColor, 1.0)
			.drawRoundedRect(...this.rect, 5)
			.endFill();
		this.border.visible = false;

		// Draw icon
		try {
			this.icon.texture =
				this.texture ?? (this.iconSrc ? await loadTexture(this.iconSrc) : "icons/svg/cancel.svg");
			this.icon.width = this.icon.height = this.size;
			this.icon.tint = Number.isNumeric(this.tintColor) ? this.tintColor : 0xffffff;
		} catch (e) {
			warn(e.stack);
			this.icon.texture = "icons/svg/cancel.svg";
			this.icon.width = this.icon.height = this.size;
			this.icon.tint = Number.isNumeric(this.tintColor) ? this.tintColor : 0xffffff;
		}
		return this;
	}
}
