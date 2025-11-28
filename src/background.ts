import { Logger } from './debug';
import { Loadvar } from './options';

let dummyTabId = null;
let originalTabId = null;
let state = false;

async function handleFocusLoss() {
	const currentTab = await browser.tabs.query({ active: true, currentWindow: true });

	if (!currentTab[0].audible) {
		await Logger.info(`current tab is not audible ${currentTab[0].title}`, 'background');
		return;
	}

	originalTabId = currentTab[0].id;
	await Logger.info(`current tab id: ${currentTab[0].id}`, 'background');

	const dummyTab = await browser.tabs.create({
		url: 'about:blank',
		active: false,
	});

	dummyTabId = dummyTab.id;
	await Logger.info(`blank tab id: ${currentTab[0].id}`, 'background');

	setTimeout(async () => {
		await browser.tabs.update(dummyTabId, { active: true });
		await Logger.info('switched to blank tab', 'background');
	}, 50);
}

async function handleFocusGain() {
	if (!dummyTabId) {
		await Logger.warn(`unable to locate blank tab with id: ${dummyTabId}`, 'background');
		return;
	}

	const currentTab = await browser.tabs.query({ active: true, currentWindow: true });

	await new Promise((resolve) => setTimeout(resolve, 10));

	if (currentTab[0].id === dummyTabId) {
		await browser.tabs.remove(dummyTabId);
		dummyTabId = null;

		try {
			await browser.tabs.get(originalTabId);
			await browser.tabs.update(originalTabId, { active: true });
			await Logger.info(`switched back to original tab id: ${originalTabId}`, 'background');
		} catch {
			await Logger.error('expected return to original tab', 'background');
		}
	}
}

browser.windows.onFocusChanged.addListener(async (windowId) => {
	const delay_value = await Loadvar('setting.delay');
	const ms = parseFloat(delay_value) * 1000;

	if (state) {
		return;
	}

	state = true;

	try {
		if (windowId === browser.windows.WINDOW_ID_NONE) {
			await Logger.info('attempting to start a pip window', 'background');
			setTimeout(async () => {
				await handleFocusLoss();
			}, ms);
		} else {
			await Logger.info('attempting to return to the original tab', 'background');
			await handleFocusGain();
		}
	} finally {
		state = false;
	}
});

browser.tabs.onRemoved.addListener((tabId) => {
	if (tabId === dummyTabId) {
		dummyTabId = null;
		originalTabId = null;
	}
});
