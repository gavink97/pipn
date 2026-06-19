type State = {
	active: boolean | undefined;
	dummyTabId: number | undefined;
	originalTabId: number | undefined;
};

async function write(state: Partial<State> | undefined): Promise<void> {
	await browser.storage.session.set({ state: state });
}

async function get(): Promise<State> {
	return (await browser.storage.session.get('state')).state;
}

async function switchNewTab(): Promise<void> {
	const active = (await browser.tabs.query({ active: true, currentWindow: true }))[0];

	if (!active?.audible || !active.active) {
		return;
	}

	const dummy = await browser.tabs.create({
		url: 'about:blank',
		active: true,
	});

	await write({
		active: true,
		originalTabId: active.id,
		dummyTabId: dummy.id,
	});
}

async function gainFocus(): Promise<void> {
	const state = await get();

	if (!state?.active) {
		return;
	}

	// biome-ignore-start lint/style/noNonNullAssertion: there will always be an original and dummy tab id
	await browser.tabs.update(state.originalTabId!, { active: true });
	await browser.tabs.remove(state.dummyTabId!);
	// biome-ignore-end lint/style/noNonNullAssertion: there will always be an original and dummy tab id

	await write(undefined);
}

async function main(windowId: number): Promise<void> {
	if (windowId === browser.windows.WINDOW_ID_NONE) {
		await switchNewTab();
	} else {
		await gainFocus();
	}
}

if (
	!browser.windows.onFocusChanged.hasListener(async (windowId: number) => {
		await main(windowId);
	})
) {
	browser.windows.onFocusChanged.addListener(async (windowId: number) => {
		await main(windowId);
	});
}
