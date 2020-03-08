const PINCUSHION = {
    moduleName: "pin-cushion",
    moduleTitle: "Pin Cushion"
} 

Hooks.on("renderNoteConfig", (app, html, data) => {
    const filePickerHtml = 
        `<input type="text" name="icon" title="Icon Path" class="icon-path" value="${data.object.icon}" placeholder="/icons/example.svg" data-dtype="String">
        <button type="button" name="file-picker" class="file-picker" data-type="image" data-target="icon" title="Browse Files" tabindex="-1">
        <i class="fas fa-file-import fa-fw"></i>
        </button>`
    
    const iconPreviewHtml = 
        `<img name="icon" src="${data.object.icon}" width="40" style="background: rgba(0, 0, 0, 0.5)">`

    const iconSelector = html.find("select[name='icon']");
    const formGroup = iconSelector.closest("div.form-group");

    iconSelector.replaceWith(filePickerHtml);
    formGroup.before(iconPreviewHtml);

    // Detect and activate file-picker buttons
    html.find('button.file-picker').each((i, button) => app._activateFilePicker(button));
    
    html.find('input.icon-path').on("change", event => {
        const iconPath = event.currentTarget.value;

        const iconPreview = html.find("img[name='icon']");

        iconPreview.attr("src", iconPath);
    });
});