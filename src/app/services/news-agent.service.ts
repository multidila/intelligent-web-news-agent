import { Injectable } from '@angular/core';
import { BehaviorSubject, forkJoin, Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

import { STORAGE_KEYS } from '../constants';
import { MonitoringStats, NewsItem, NewsSource } from '../models';
import { AgentConfigService } from './agent-config.service';
import { RssFeedParserService } from './rss-feed-parser.service';
import { WebsiteChange, WebsiteMonitorService } from './website-monitor.service';

@Injectable({
	providedIn: 'root',
})
export class NewsAgentService {
	private readonly _storageKey = STORAGE_KEYS.newsItems;
	private readonly _newsSubject = new BehaviorSubject<NewsItem[]>([]);
	private readonly _statsSubject = new BehaviorSubject<MonitoringStats>({
		totalNews: 0,
		filteredNews: 0,
		sourcesChecked: 0,
		lastUpdate: new Date(),
		errors: 0,
	});
	private readonly _websiteChangesSubject = new BehaviorSubject<WebsiteChange[]>([]);
	private readonly _isMonitoringSubject = new BehaviorSubject<boolean>(false);

	private _monitoringInterval?: ReturnType<typeof setInterval>;

	public news$: Observable<NewsItem[]> = this._newsSubject.asObservable();
	public stats$: Observable<MonitoringStats> = this._statsSubject.asObservable();
	public websiteChanges$: Observable<WebsiteChange[]> = this._websiteChangesSubject.asObservable();
	public isMonitoring$: Observable<boolean> = this._isMonitoringSubject.asObservable();

	constructor(
		private readonly _rssParser: RssFeedParserService,
		private readonly _configService: AgentConfigService,
		private readonly _httpMonitor: WebsiteMonitorService,
	) {
		this._loadNews();
		this._initAutoRefresh();
	}

	private _loadNews(): void {
		try {
			const stored = localStorage.getItem(this._storageKey);
			if (stored) {
				const news = JSON.parse(stored).map((item: NewsItem) => ({
					...item,
					pubDate: new Date(item.pubDate),
				}));
				this._newsSubject.next(news);
			}
		} catch (error) {
			console.error('Error loading news:', error);
		}
	}

	private _saveNews(news: NewsItem[]): void {
		try {
			localStorage.setItem(this._storageKey, JSON.stringify(news));
		} catch (error) {
			console.error('Error saving news:', error);
		}
	}

	private _initAutoRefresh(): void {
		this._configService.config$.subscribe((config) => {
			if (config.autoRefresh && !this._isMonitoringSubject.value) {
				this.startMonitoring();
			} else if (!config.autoRefresh && this._isMonitoringSubject.value) {
				this.stopMonitoring();
			}
		});
	}

	private _checkHttpSources(sources: NewsSource[]): void {
		const urls = sources.map((s) => s.url);
		this._httpMonitor.checkMultipleWebsites(urls).subscribe({
			next: (changes) => {
				this._websiteChangesSubject.next(changes);
				changes.forEach((change) => {
					const source = sources.find((s) => s.url === change.url);
					if (source) {
						this._updateSourceLastChecked(source.id);
						if (change.changed) {
							console.log(`Website changed: ${source.name}`);
						}
					}
				});
			},
			error: (error: unknown) => {
				console.error('Error checking HTTP sources:', error);
				this._incrementErrors();
			},
		});
	}

	private _processNews(newNews: NewsItem[]): void {
		const existingNews = this._newsSubject.value;
		const existingIds = new Set(existingNews.map((n) => n.id));

		const uniqueNewNews = newNews.filter((n) => !existingIds.has(n.id));
		const allNews = [...uniqueNewNews, ...existingNews];

		const filteredNews = this._applyFilters(allNews);

		const config = this._configService.getConfig();
		const limitedNews = filteredNews.slice(0, config.maxNewsItems);

		this._newsSubject.next(limitedNews);
		this._saveNews(limitedNews);
	}

	private _applyFilters(news: NewsItem[]): NewsItem[] {
		const config = this._configService.getConfig();
		const filters = config.filters;

		return news
			.map((item) => {
				let score = 0;

				if (filters.keywords.length > 0) {
					const text = (item.title + ' ' + item.description).toLowerCase();
					filters.keywords.forEach((keyword) => {
						if (text.includes(keyword.toLowerCase())) {
							score += 2;
						}
					});

					item.keywords.forEach((kw) => {
						if (filters.keywords.some((fk) => fk.toLowerCase() === kw.toLowerCase())) {
							score += 1;
						}
					});
				} else {
					score = 1;
				}

				if (filters.excludeKeywords.length > 0) {
					const text = (item.title + ' ' + item.description).toLowerCase();
					const hasExcluded = filters.excludeKeywords.some((keyword) => text.includes(keyword.toLowerCase()));
					if (hasExcluded) {
						score = -1;
					}
				}

				if (filters.categories.length > 0 && item.category) {
					if (filters.categories.includes(item.category)) {
						score += 1;
					}
				}

				if (filters.sources.length > 0) {
					if (filters.sources.includes(item.source)) {
						score += 1;
					}
				}

				if (filters.dateFrom && item.pubDate < filters.dateFrom) {
					score = -1;
				}

				if (filters.dateTo && item.pubDate > filters.dateTo) {
					score = -1;
				}

				return { ...item, relevanceScore: score };
			})
			.filter((item) => item.relevanceScore > 0)
			.sort((a, b) => {
				if (b.relevanceScore !== a.relevanceScore) {
					return b.relevanceScore - a.relevanceScore;
				}
				return b.pubDate.getTime() - a.pubDate.getTime();
			});
	}

	private _updateSourceLastChecked(sourceId: string): void {
		const config = this._configService.getConfig();
		const sources = config.sources.map((s) => (s.id === sourceId ? { ...s, lastChecked: new Date() } : s));
		this._configService.updateConfig({ sources });
	}

	private _updateStats(sourcesChecked: number, totalNews: number): void {
		const filteredNews = this._newsSubject.value.length;
		this._statsSubject.next({
			totalNews,
			filteredNews,
			sourcesChecked,
			lastUpdate: new Date(),
			errors: this._statsSubject.value.errors,
		});
	}

	private _incrementErrors(): void {
		const stats = this._statsSubject.value;
		this._statsSubject.next({ ...stats, errors: stats.errors + 1 });
	}

	public startMonitoring(): void {
		if (this._isMonitoringSubject.value) {
			return;
		}

		this._isMonitoringSubject.next(true);
		this.fetchAllNews();

		const config = this._configService.getConfig();
		if (config.autoRefresh && config.checkInterval > 0) {
			this._monitoringInterval = setInterval(() => {
				this.fetchAllNews();
			}, config.checkInterval);
		}
	}

	public stopMonitoring(): void {
		if (this._monitoringInterval) {
			clearInterval(this._monitoringInterval);
			this._monitoringInterval = undefined;
		}
		this._isMonitoringSubject.next(false);
	}

	public fetchAllNews(): void {
		const config = this._configService.getConfig();
		const enabledSources = config.sources.filter((s) => s.enabled);

		if (enabledSources.length === 0) {
			console.warn('No enabled sources');
			return;
		}

		const rssSources = enabledSources.filter((s) => s.type === 'rss');
		const httpSources = enabledSources.filter((s) => s.type === 'http');

		const rssRequests = rssSources.map((source) =>
			this._rssParser.parseRssFeed(source.url, source.name).pipe(
				tap(() => this._updateSourceLastChecked(source.id)),
				catchError((error: unknown) => {
					console.error(`Error fetching ${source.name}:`, error);
					this._incrementErrors();
					return of([]);
				}),
			),
		);

		forkJoin(rssRequests.length > 0 ? rssRequests : [of([])]).subscribe({
			next: (results: NewsItem[][]) => {
				const allNews = results.flat();
				this._processNews(allNews);

				if (httpSources.length > 0) {
					this._checkHttpSources(httpSources);
				}

				this._updateStats(enabledSources.length, allNews.length);
			},
			error: (error: unknown) => {
				console.error('Error fetching news:', error);
				this._incrementErrors();
			},
		});
	}

	public markAsRead(newsId: string): void {
		const news = this._newsSubject.value.map((item) => (item.id === newsId ? { ...item, isRead: true } : item));
		this._newsSubject.next(news);
		this._saveNews(news);
	}

	public clearAllNews(): void {
		this._newsSubject.next([]);
		localStorage.removeItem(this._storageKey);
		this._updateStats(0, 0);
	}
}
