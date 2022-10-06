import CONSTANTS from "../constants.js";
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
			} else {
				return canvas.tokens?.placeables;
			}
		} else {
			return canvas.tokens?.placeables;
		}
	}
	if (priorityToControlledIfGM) {
		const arr = canvas.tokens?.controlled;
		if (arr && arr.length > 0) {
			return arr;
		}
	}
	let ownedTokens = canvas.tokens?.placeables.filter((token) => token.isOwner && (!token.document.hidden || gm));
	if (ownedTokens.length === 0 || !canvas.tokens?.controlled[0]) {
		ownedTokens = canvas.tokens?.placeables.filter(
			(token) => (token.observer || token.isOwner) && (!token.document.hidden || gm)
		);
	}
	return ownedTokens;
}
export function is_UUID(inId) {
	return typeof inId === "string" && (inId.match(/\./g) || []).length && !inId.endsWith(".");
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
	if (target instanceof foundry.abstract.Document) return target;
	return target?.document;
}
export function is_real_number(inNumber) {
	return !isNaN(inNumber) && typeof inNumber === "number" && isFinite(inNumber);
}
export function isGMConnected() {
	return !!Array.from(game.users).find((user) => user.isGM && user.active);
}
export function isGMConnectedAndSocketLibEnable() {
	return isGMConnected(); // && !game.settings.get(CONSTANTS.MODULE_NAME, 'doNotUseSocketLibFeature');
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
	if (!game.user?.isGM) return false;
	return !getActiveGMs()?.some((other) => other.document._id < game.user?.document._id);
}
// ================================
// Logger utility
// ================================
// export let debugEnabled = 0;
// 0 = none, warnings = 1, debug = 2, all = 3
export function debug(msg, args = "") {
	//if (game.settings.get(CONSTANTS.MODULE_NAME, 'debug')) {
	console.log(`DEBUG | ${CONSTANTS.MODULE_NAME} | ${msg}`, args);
	//}
	return msg;
}
export function log(message) {
	message = `${CONSTANTS.MODULE_NAME} | ${message}`;
	console.log(message.replace("<br>", "\n"));
	return message;
}
export function notify(message) {
	message = `${CONSTANTS.MODULE_NAME} | ${message}`;
	ui.notifications?.notify(message);
	console.log(message.replace("<br>", "\n"));
	return message;
}
export function info(info, notify = false) {
	info = `${CONSTANTS.MODULE_NAME} | ${info}`;
	if (notify) ui.notifications?.info(info);
	console.log(info.replace("<br>", "\n"));
	return info;
}
export function warn(warning, notify = false) {
	warning = `${CONSTANTS.MODULE_NAME} | ${warning}`;
	if (notify) ui.notifications?.warn(warning);
	console.warn(warning.replace("<br>", "\n"));
	return warning;
}
export function error(error, notify = true) {
	error = `${CONSTANTS.MODULE_NAME} | ${error}`;
	if (notify) ui.notifications?.error(error);
	return new Error(error.replace("<br>", "\n"));
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
export function dialogWarning(message, icon = "fas fa-exclamation-triangle") {
	return `<p class="${CONSTANTS.MODULE_NAME}-dialog">
        <i style="font-size:3rem;" class="${icon}"></i><br><br>
        <strong style="font-size:1.2rem;">${CONSTANTS.MODULE_NAME}</strong>
        <br><br>${message}
    </p>`;
}
// =================================================================================

export function isPlacementVertical(tooltipPlacement) {
	// n, e, s, w, nw, ne, sw, se, nw-alt, ne-alt, sw-alt
	const arr = ["n", "s", "nw", "ne", "sw", "se", "nw-alt", "ne-alt", "sw-alt"];
	if (arr.includes(tooltipPlacement)) {
		return true;
	} else {
		return false;
	}
}
/*
function getOffsetSum(elem) {
    let top=0, left=0
    while(elem) {
        top = top + parseInt(elem.offsetTop)
        left = left + parseInt(elem.offsetLeft)
        elem = elem.offsetParent
    }

    return {top: top, left: left}
}


function getOffsetRect(elem) {
    let box = elem.getBoundingClientRect()

    let body = document.body
    let docElem = document.documentElement

    let scrollTop = window.pageYOffset || docElem.scrollTop || body.scrollTop
    let scrollLeft = window.pageXOffset || docElem.scrollLeft || body.scrollLeft

    let clientTop = docElem.clientTop || body.clientTop || 0
    let clientLeft = docElem.clientLeft || body.clientLeft || 0

    let top  = box.top +  scrollTop - clientTop
    let left = box.left + scrollLeft - clientLeft

    return { top: Math.round(top), left: Math.round(left) }
}


export function getOffset(elem) {
    if (elem.getBoundingClientRect) {
        return getOffsetRect(elem)
    } else {
        return getOffsetSum(elem)
    }
}
*/

export function stripQueryStringAndHashFromPath(url) {
	let myUrl = url;
	if (!myUrl) {
		return myUrl;
	}
	if (myUrl.includes("?")) {
		myUrl = myUrl.split("?")[0];
	}
	if (myUrl.includes("#")) {
		myUrl = myUrl.split("#")[0];
	}
	return myUrl;
}

export function isAlt() {
	// check if Alt and only Alt is being pressed during the drop event.
	const alts = new Set(["Alt", "AltLeft"]);
	return game.keyboard?.downKeys.size === 1 && game.keyboard.downKeys.intersects(alts);
}

export function retrieveFirstImageFromJournalHtml(html) {
	const lis = html.find("li.journalentry");
	for (const li of lis) {
		const target = $(li);
		const id = target.data("document-id");
		const journalEntry = game.journal.get(id);
		// Support old data image
		if (journalEntry?.data?.img) {
			return stripQueryStringAndHashFromPath(journalEntry?.data?.img);
		}
		// Support new image type journal
		if (journalEntry?.pages.size > 0) {
			const sortedArray = journalEntry.pages.contents.sort((a, b) => a.sort - b.sort);
			const firstJournalPage = sortedArray[0];
			if (firstJournalPage.src) {
				return stripQueryStringAndHashFromPath(firstJournalPage.src);
			}
		}
	}
	return undefined;
}

export function retrieveFirstImageFromJournalId(id) {
	const journalEntry = game.journal.get(id);
	// Support old data image
	if (journalEntry?.data?.img) {
		return stripQueryStringAndHashFromPath(journalEntry?.data?.img);
	}
	// Support new image type journal
	if (journalEntry?.pages.size > 0) {
		const sortedArray = journalEntry.pages.contents.sort((a, b) => a.sort - b.sort);
		const firstJournalPage = sortedArray[0];
		if (firstJournalPage.src) {
			return stripQueryStringAndHashFromPath(firstJournalPage.src);
		}
	}
	return undefined;
}
