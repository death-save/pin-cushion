import CONSTANTS from '../constants.js';
// =============================
// Module Generic function
// =============================
export async function getToken(documentUuid) {
    const document = await fromUuid(documentUuid);
    //@ts-ignore
    return document?.token ?? document;
}
export function getOwnedTokens(priorityToControlledIfGM) {
    const gm = game.user?.isGM;
    if (gm) {
        if (priorityToControlledIfGM) {
            const arr = canvas.tokens?.controlled;
            if (arr && arr.length > 0) {
                return arr;
            }
            else {
                return canvas.tokens?.placeables;
            }
        }
        else {
            return canvas.tokens?.placeables;
        }
    }
    if (priorityToControlledIfGM) {
        const arr = canvas.tokens?.controlled;
        if (arr && arr.length > 0) {
            return arr;
        }
    }
    let ownedTokens = canvas.tokens?.placeables.filter((token) => token.isOwner && (!token.data.hidden || gm));
    if (ownedTokens.length === 0 || !canvas.tokens?.controlled[0]) {
        ownedTokens = (canvas.tokens?.placeables.filter((token) => (token.observer || token.isOwner) && (!token.data.hidden || gm)));
    }
    return ownedTokens;
}
export function is_UUID(inId) {
    return typeof inId === 'string' && (inId.match(/\./g) || []).length && !inId.endsWith('.');
}
export function getUuid(target) {
    // If it's an actor, get its TokenDocument
    // If it's a token, get its Document
    // If it's a TokenDocument, just use it
    // Otherwise fail
    const document = getDocument(target);
    return document?.uuid ?? false;
}
export function getDocument(target) {
    if (target instanceof foundry.abstract.Document)
        return target;
    return target?.document;
}
export function is_real_number(inNumber) {
    return !isNaN(inNumber) && typeof inNumber === 'number' && isFinite(inNumber);
}
export function isGMConnected() {
    return !!Array.from(game.users).find((user) => user.isGM && user.active);
}
export function isGMConnectedAndSocketLibEnable() {
    return isGMConnected() ; // && !game.settings.get(CONSTANTS.MODULE_NAME, 'doNotUseSocketLibFeature');
}
export function wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
export function isActiveGM(user) {
    return user.active && user.isGM;
}
export function getActiveGMs() {
    return game.users?.filter(isActiveGM);
}
export function isResponsibleGM() {
    if (!game.user?.isGM)
        return false;
    return !getActiveGMs()?.some((other) => other.data._id < game.user?.data._id);
}
// ================================
// Logger utility
// ================================
// export let debugEnabled = 0;
// 0 = none, warnings = 1, debug = 2, all = 3
export function debug(msg, args = '') {
    //if (game.settings.get(CONSTANTS.MODULE_NAME, 'debug')) {
        console.log(`DEBUG | ${CONSTANTS.MODULE_NAME} | ${msg}`, args);
    //}
    return msg;
}
export function log(message) {
    message = `${CONSTANTS.MODULE_NAME} | ${message}`;
    console.log(message.replace('<br>', '\n'));
    return message;
}
export function notify(message) {
    message = `${CONSTANTS.MODULE_NAME} | ${message}`;
    ui.notifications?.notify(message);
    console.log(message.replace('<br>', '\n'));
    return message;
}
export function info(info, notify = false) {
    info = `${CONSTANTS.MODULE_NAME} | ${info}`;
    if (notify)
        ui.notifications?.info(info);
    console.log(info.replace('<br>', '\n'));
    return info;
}
export function warn(warning, notify = false) {
    warning = `${CONSTANTS.MODULE_NAME} | ${warning}`;
    if (notify)
        ui.notifications?.warn(warning);
    console.warn(warning.replace('<br>', '\n'));
    return warning;
}
export function error(error, notify = true) {
    error = `${CONSTANTS.MODULE_NAME} | ${error}`;
    if (notify)
        ui.notifications?.error(error);
    return new Error(error.replace('<br>', '\n'));
}
export function timelog(message) {
    warn(Date.now(), message);
}
export const i18n = (key) => {
    return game.i18n.localize(key)?.trim();
};
export const i18nFormat = (key, data = {}) => {
    return game.i18n.format(key, data)?.trim();
};
// export const setDebugLevel = (debugText: string): void => {
//   debugEnabled = { none: 0, warn: 1, debug: 2, all: 3 }[debugText] || 0;
//   // 0 = none, warnings = 1, debug = 2, all = 3
//   if (debugEnabled >= 3) CONFIG.debug.hooks = true;
// };
export function dialogWarning(message, icon = 'fas fa-exclamation-triangle') {
    return `<p class="${CONSTANTS.MODULE_NAME}-dialog">
        <i style="font-size:3rem;" class="${icon}"></i><br><br>
        <strong style="font-size:1.2rem;">${CONSTANTS.MODULE_NAME}</strong>
        <br><br>${message}
    </p>`;
}
// =================================================================================