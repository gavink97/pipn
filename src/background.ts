let dummyTabId = null;
let originalTabId = null;
let state = false;

async function handleFocusLoss() {
	const currentTab = await browser.tabs.query({ active: true, currentWindow: true });

	if (!currentTab[0].audible) {
		return;
	}

	originalTabId = currentTab[0].id;

	const dummyTab = await browser.tabs.create({
		url: 'about:blank',
		active: false,
	});

	dummyTabId = dummyTab.id;

	setTimeout(async () => {
		await browser.tabs.update(dummyTabId, { active: true });
	}, 50);
}

async function handleFocusGain() {
	if (!dummyTabId) return;

	const currentTab = await browser.tabs.query({ active: true, currentWindow: true });

	await new Promise((resolve) => setTimeout(resolve, 10));

	if (currentTab[0].id === dummyTabId) {
		await browser.tabs.remove(dummyTabId);
		dummyTabId = null;

		try {
			await browser.tabs.get(originalTabId);
			await browser.tabs.update(originalTabId, { active: true });
		} catch {
			// Original tab was closed
		}
	}
}

browser.windows.onFocusChanged.addListener(async (windowId) => {
	if (state) {
		return;
	}

	state = true;

	try {
		if (windowId === browser.windows.WINDOW_ID_NONE) {
			await handleFocusLoss();
		} else {
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
