import { TraktAuthDetails } from '../api/TraktAuth';
import { Shared } from './Shared';
import { StreamingServiceId, streamingServices } from '../streaming-services';

export type StorageValues = {
	auth?: TraktAuthDetails;
	options?: StorageValuesOptions;
	syncOptions?: StorageValuesSyncOptions;
	traktCache?: {
		[key: string]: string;
	};
};

export type StorageValuesOptions = {
	streamingServices: Record<StreamingServiceId, boolean>;
	allowRollbar: boolean;
	sendReceiveSuggestions: boolean;
	grantCookies: boolean;
};

export type StorageValuesSyncOptions = {
	addWithReleaseDate: boolean;
	hideSynced: boolean;
	itemsPerLoad: number;
};

export type Options = {
	[K in keyof StorageValuesOptions]: Option<K>;
};

export type Option<K extends keyof StorageValuesOptions> = {
	id: K;
	name: string;
	description: string;
	value: StorageValuesOptions[K];
	origins: string[];
	permissions: browser.permissions.Permission[];
	doShow: boolean;
};

export type SyncOptions = {
	[K in keyof StorageValuesSyncOptions]: {
		id: K;
		value: StorageValuesSyncOptions[K];
		name: string;
	};
};

export type SyncOption = SyncOptions[keyof SyncOptions];

class _BrowserStorage {
	isSyncAvailable: boolean;

	constructor() {
		this.isSyncAvailable = !!browser.storage.sync;
	}

	sync = async (): Promise<void> => {
		if (this.isSyncAvailable) {
			const values = await browser.storage.sync.get();
			for (const key of Object.keys(values)) {
				await browser.storage.local.set({ [key]: values[key] });
			}
		}
	};

	set = async (values: StorageValues, doSync: boolean): Promise<void> => {
		if (doSync && this.isSyncAvailable) {
			await browser.storage.sync.set(values);
		}
		await browser.storage.local.set(values);
	};

	get = (keys?: string | string[]): Promise<StorageValues> => {
		return browser.storage.local.get(keys);
	};

	remove = async (keys: string | string[], doSync = false): Promise<void> => {
		if (doSync && this.isSyncAvailable) {
			await browser.storage.sync.remove(keys);
		}
		await browser.storage.local.remove(keys);
	};

	clear = async (doSync: boolean): Promise<void> => {
		if (doSync && this.isSyncAvailable) {
			await browser.storage.sync.clear();
		}
		await browser.storage.local.clear();
	};

	getSize = async (keys?: string | string[]): Promise<string> => {
		let size = '';
		const values = await this.get(keys);
		let bytes = (JSON.stringify(values) || '').length;
		if (bytes < 1024) {
			size = `${bytes.toFixed(2)} B`;
		} else {
			bytes /= 1024;
			if (bytes < 1024) {
				size = `${bytes.toFixed(2)} KB`;
			} else {
				bytes /= 1024;
				size = `${bytes.toFixed(2)} MB`;
			}
		}
		return size;
	};

	getOptions = async (): Promise<Options> => {
		const options: Options = {
			streamingServices: {
				id: 'streamingServices',
				name: '',
				description: '',
				value: Object.fromEntries(
					Object.keys(streamingServices).map((serviceId) => [serviceId, false])
				) as Record<StreamingServiceId, boolean>,
				origins: [],
				permissions: [],
				doShow: true,
			},
			sendReceiveSuggestions: {
				id: 'sendReceiveSuggestions',
				name: '',
				description: '',
				value: false,
				origins: ['*://script.google.com/*', '*://script.googleusercontent.com/*'],
				permissions: [],
				doShow: true,
			},
			allowRollbar: {
				id: 'allowRollbar',
				name: '',
				description: '',
				value: false,
				origins: ['*://api.rollbar.com/*'],
				permissions: [],
				doShow: true,
			},
			grantCookies: {
				id: 'grantCookies',
				name: '',
				description: '',
				value: false,
				origins: [],
				permissions: ['cookies', 'webRequest', 'webRequestBlocking'],
				doShow: Shared.browser === 'firefox',
			},
		};
		const values = await BrowserStorage.get('options');
		for (const option of Object.values(options)) {
			option.name = browser.i18n.getMessage(`${option.id}Name`);
			option.description = browser.i18n.getMessage(`${option.id}Description`);
			option.value = (values.options && values.options[option.id]) || option.value;
		}
		return options;
	};

	getSyncOptions = async (): Promise<SyncOptions> => {
		const options: SyncOptions = {
			hideSynced: {
				id: 'hideSynced',
				name: '',
				value: false,
			},
			addWithReleaseDate: {
				id: 'addWithReleaseDate',
				name: '',
				value: false,
			},
			itemsPerLoad: {
				id: 'itemsPerLoad',
				name: '',
				value: 10,
			},
		};
		const values = await BrowserStorage.get('syncOptions');
		for (const option of Object.values(options)) {
			option.name = browser.i18n.getMessage(`${option.id}Name`);
			option.value = (values.syncOptions && values.syncOptions[option.id]) || option.value;
		}
		return options;
	};
}

export const BrowserStorage = new _BrowserStorage();
