import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { API_ENDPOINTS, STORAGE_KEYS } from '../constants';

export interface WebsiteChange {
	url: string;
	lastSize?: number;
	currentSize: number;
	changed: boolean;
	lastChecked: Date;
	error?: string;
}

@Injectable({
	providedIn: 'root',
})
export class WebsiteMonitorService {
	private readonly _storageKey = STORAGE_KEYS.websiteMonitorData;
	private readonly _corsProxy = API_ENDPOINTS.corsProxy;
	private _monitoredSites: Map<string, WebsiteChange> = new Map();

	constructor(private readonly _http: HttpClient) {
		this._loadMonitorData();
	}

	private _loadMonitorData(): void {
		try {
			const stored = localStorage.getItem(this._storageKey);
			if (stored) {
				const data = JSON.parse(stored) as Record<string, WebsiteChange>;
				this._monitoredSites = new Map(
					Object.entries(data).map(([url, change]) => [
						url,
						{
							...change,
							lastChecked: new Date(change.lastChecked),
						},
					]),
				);
			}
		} catch (error) {
			console.error('Error loading monitor data:', error);
		}
	}

	private _saveMonitorData(): void {
		try {
			const data = Object.fromEntries(this._monitoredSites);
			localStorage.setItem(this._storageKey, JSON.stringify(data));
		} catch (error) {
			console.error('Error saving monitor data:', error);
		}
	}

	public checkWebsite(url: string): Observable<WebsiteChange> {
		const proxyUrl = `${this._corsProxy}${encodeURIComponent(url)}`;

		return this._http.get(proxyUrl, { responseType: 'text' }).pipe(
			map((content) => {
				const currentSize = content.length;
				const stored = this._monitoredSites.get(url);
				const lastSize = stored?.currentSize;

				const change: WebsiteChange = {
					url,
					lastSize,
					currentSize,
					changed: lastSize !== undefined && lastSize !== currentSize,
					lastChecked: new Date(),
				};

				this._monitoredSites.set(url, change);
				this._saveMonitorData();

				return change;
			}),
			catchError((error: unknown) => {
				const change: WebsiteChange = {
					url,
					currentSize: 0,
					changed: false,
					lastChecked: new Date(),
					error: error instanceof Error ? error.message : String(error),
				};
				return of(change);
			}),
		);
	}

	public checkMultipleWebsites(urls: string[]): Observable<WebsiteChange[]> {
		return new Observable((observer) => {
			const results: WebsiteChange[] = [];
			let completed = 0;

			urls.forEach((url) => {
				this.checkWebsite(url).subscribe({
					next: (change) => {
						results.push(change);
						completed++;
						if (completed === urls.length) {
							observer.next(results);
							observer.complete();
						}
					},
					error: (error: unknown) => {
						console.error(`Error checking ${url}:`, error);
						completed++;
						if (completed === urls.length) {
							observer.next(results);
							observer.complete();
						}
					},
				});
			});
		});
	}

	public getMonitoredSites(): WebsiteChange[] {
		return Array.from(this._monitoredSites.values());
	}

	public getChangedSites(): WebsiteChange[] {
		return this.getMonitoredSites().filter((site) => site.changed);
	}

	public clearMonitorData(): void {
		this._monitoredSites.clear();
		localStorage.removeItem(this._storageKey);
	}

	public resetSite(url: string): void {
		this._monitoredSites.delete(url);
		this._saveMonitorData();
	}
}
