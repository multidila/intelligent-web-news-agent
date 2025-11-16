import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

import { DEFAULT_AGENT_CONFIG, STORAGE_KEYS } from '../constants';
import { AgentConfig, FilterConfig, NewsSource } from '../models';

@Injectable({
	providedIn: 'root',
})
export class AgentConfigService {
	private readonly _storageKey = STORAGE_KEYS.agentConfig;
	private readonly _configSubject = new BehaviorSubject<AgentConfig>(this._loadConfig());

	public config$: Observable<AgentConfig> = this._configSubject.asObservable();

	constructor() {
		this._loadConfig();
	}

	private _loadConfig(): AgentConfig {
		try {
			const stored = localStorage.getItem(this._storageKey);
			if (stored) {
				const parsed = JSON.parse(stored);
				return { ...DEFAULT_AGENT_CONFIG, ...parsed };
			}
		} catch (error) {
			console.error('Error loading config:', error);
		}
		return DEFAULT_AGENT_CONFIG;
	}

	private _saveConfig(config: AgentConfig): void {
		try {
			localStorage.setItem(this._storageKey, JSON.stringify(config));
		} catch (error) {
			console.error('Error saving config:', error);
		}
	}

	public getConfig(): AgentConfig {
		return this._configSubject.value;
	}

	public updateConfig(config: Partial<AgentConfig>): void {
		const currentConfig = this._configSubject.value;
		const newConfig = { ...currentConfig, ...config };
		this._saveConfig(newConfig);
		this._configSubject.next(newConfig);
	}

	public updateFilters(filters: Partial<FilterConfig>): void {
		const currentConfig = this.getConfig();
		const newFilters = { ...currentConfig.filters, ...filters };
		this.updateConfig({ filters: newFilters });
	}

	public addSource(source: NewsSource): void {
		const currentConfig = this.getConfig();
		const sources = [...currentConfig.sources, source];
		this.updateConfig({ sources });
	}

	public removeSource(sourceId: string): void {
		const currentConfig = this.getConfig();
		const sources = currentConfig.sources.filter((s) => s.id !== sourceId);
		this.updateConfig({ sources });
	}

	public toggleSource(sourceId: string): void {
		const currentConfig = this.getConfig();
		const sources = currentConfig.sources.map((s) => (s.id === sourceId ? { ...s, enabled: !s.enabled } : s));
		this.updateConfig({ sources });
	}

	public resetConfig(): void {
		this._saveConfig(DEFAULT_AGENT_CONFIG);
		this._configSubject.next(DEFAULT_AGENT_CONFIG);
	}
}
