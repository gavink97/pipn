import { Loadvar, Storevar } from './options';

export class DebugLogger {
	private static instance: DebugLogger;
	private maxLines: number = 500;
	private localListeners: ((message: string) => void)[] = [];

	private constructor() {
		browser.storage.onChanged.addListener((changes, area) => {
			if (area === 'local' && changes.logs) {
				this.notifyLocalListeners(changes.debugLogs.newValue);
			}
		});
	}

	static getInstance(): DebugLogger {
		if (!DebugLogger.instance) {
			DebugLogger.instance = new DebugLogger();
		}

		return DebugLogger.instance;
	}

	async log(level: 'INFO' | 'WARN' | 'ERROR', message: string, source?: string): Promise<Error> {
		const timestamp = new Date().toISOString();
		const sourceInfo = source ? `[${source}]` : '';
		const entry = `[${timestamp}] ${level} ${sourceInfo} ${message}`;

		try {
			const result = await Loadvar('logs.debugging');
			const currentLogs: string[] = result ?? [];

			const updatedLogs = [...currentLogs, entry].slice(-this.maxLines);
			await Storevar('logs.debugging', updatedLogs);

			this.consoleLog(level, entry);
			return null;
		} catch (error) {
			return error;
		}
	}
	async info(message: string, source?: string): Promise<Error> {
		const err = await this.log('INFO', message, source);
		if (err != null) {
			return err;
		}
		return null;
	}

	async warn(message: string, source?: string): Promise<Error> {
		const err = await this.log('WARN', message, source);
		if (err != null) {
			return err;
		}
		return null;
	}

	async error(message: string, source?: string): Promise<Error> {
		const err = await this.log('ERROR', message, source);
		if (err != null) {
			return err;
		}
		return null;
	}

	async clear(): Promise<Error> {
		try {
			await browser.storage.local.remove('logs.debugging');
			return null;
		} catch (error) {
			return error;
		}
	}

	addLocalListener(callback: (message: string) => void): void {
		this.localListeners = this.localListeners.filter((cb) => cb !== callback);
	}

	removeLocalListener(callback: (message: string) => void): void {
		this.localListeners = this.localListeners.filter((cb) => cb !== callback);
	}

	private notifyLocalListeners(logs: string[]): void {
		const latestMessage = logs[logs.length - 1];
		this.localListeners.forEach((callback) => {
			try {
				callback(latestMessage);
				return null;
			} catch (error) {
				return error;
			}
		});
	}

	private consoleLog(level: string, message: string): void {
		const styles = {
			INFO: 'color: blue',
			WARN: 'color: orange',
			ERROR: 'color: red',
		};

		console.log(`%c${message}`, styles[level as keyof typeof styles]);
	}
}

export const Logger = DebugLogger.getInstance();
