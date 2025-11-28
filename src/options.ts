import { Logger } from './debug';

class DebugPanel {
	private debugBox: HTMLTextAreaElement;

	constructor() {
		this.debugBox = document.getElementById('debug-box') as HTMLTextAreaElement;
		this.startLogMonitoring();
	}

	private async startLogMonitoring(): Promise<void> {
		const error = await this.refreshLogs();
		if (error != null) {
			console.error(error);
		}

		Logger.addLocalListener((message: string) => {
			this.appendLog(message);
		});

		setInterval(async () => {
			await this.refreshLogs();
		}, 2000);
	}

	private async refreshLogs(): Promise<Error> {
		try {
			const logs: string[] = await Loadvar('logs.debugging');
			this.debugBox.value = logs.join('\n');
			this.debugBox.scrollTop = this.debugBox.scrollHeight;
			return null;
		} catch (error) {
			return error;
		}
	}

	private appendLog(message: string): void {
		this.debugBox.value += `\n${message}`;
		this.debugBox.scrollTop = this.debugBox.scrollHeight;
	}

	private async clearLogs(): Promise<void> {
		await Logger.clear();
		this.debugBox.value = '';
	}
}

export async function Loadvar(key: string): Promise<any> {
	const local_storage = browser.storage.local;
	const result = await local_storage.get(key);
	return result[key];
}

export async function Storevar(key: string, value: any) {
	const local_storage = browser.storage.local;
	local_storage.set({ [key]: value });
}

function handleError(error: any) {
	console.error(error);
}

async function debugPanel() {
	let delay_value = (await Loadvar('setting.delay')) ?? '0.00';
	let debugging_enabled = (await Loadvar('setting.debugging')) ?? false;

	await Logger.info(`delay value: ${delay_value}`, 'options');
	await Logger.info(`debugging enabled: ${debugging_enabled}`, 'options');

	const input = document.getElementById('delay') as HTMLInputElement;
	const value = document.getElementById('delay-value') as HTMLLabelElement;

	input.value = delay_value;
	value.textContent = `${delay_value}s`;

	input.addEventListener('input', (event: Event) => {
		const target = event.target as HTMLInputElement;
		delay_value = parseFloat(target.value).toFixed(2);
		value.textContent = `${delay_value}s`;
	});

	const debugging = document.getElementById('debugging') as HTMLInputElement;
	const panel = document.getElementById('debug-panel') as HTMLDivElement;

	debugging.checked = debugging_enabled;
	if (debugging_enabled) {
		panel.classList.remove('hidden');
	} else {
		panel.classList.add('hidden');
	}

	debugging.addEventListener('input', () => {
		if (debugging.checked) {
			debugging_enabled = true;
			panel.classList.remove('hidden');
		} else {
			debugging_enabled = false;
			panel.classList.add('hidden');
		}
	});

	const debug_specs = document.getElementById('debug-specs') as HTMLTextAreaElement;

	const manifest = browser.runtime.getManifest();
	const platform = await browser.runtime.getPlatformInfo();
	const info = await browser.runtime.getBrowserInfo();

	debug_specs.textContent += `pipn v${manifest.version} \n`;
	debug_specs.textContent += `${info.name} ${info.version} ${platform.os}/${platform.arch} (build: ${info.buildID}) \n`;

	const issue = document.getElementById('create-issue') as HTMLAnchorElement;
	issue.href = ``;

	const submit = document.getElementById('submit') as HTMLButtonElement;

	submit.addEventListener('click', async (event: Event) => {
		event.preventDefault();
		Storevar('setting.delay', delay_value);
		Storevar('setting.debugging', debugging_enabled);
		await Logger.info(`delay value: ${delay_value}`, 'options');
		await Logger.info(`debugging enabled: ${debugging_enabled}`, 'options');
	});
}

document.addEventListener('DOMContentLoaded', () => {
	new DebugPanel();
});

(async () => {
	try {
		await debugPanel();
	} catch (error) {
		handleError(error);
	}
})();
