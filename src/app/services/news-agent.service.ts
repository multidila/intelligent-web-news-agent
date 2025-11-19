import { Injectable } from '@angular/core';
import { BehaviorSubject, concatMap, delay, from, Observable, of, Subject } from 'rxjs';
import { catchError, takeUntil, tap, toArray } from 'rxjs/operators';

import { STORAGE_KEYS } from '../constants';
import { MonitoringStats, NewsItem } from '../models';
import { AgentConfigService } from './agent-config.service';
import { RssFeedParserService } from './rss-feed-parser.service';

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
	private readonly _monitoringSubject = new BehaviorSubject<boolean>(false);
	private readonly _loadingSubject = new BehaviorSubject<boolean>(false);
	private readonly _progressSubject = new BehaviorSubject<number>(0);

	private _monitoringInterval?: ReturnType<typeof setInterval>;
	private _manualStop = false;
	private readonly _sourceErrors = new Map<string, number>();
	private readonly _maxSourceErrors = 5;
	private readonly _cancelRequests$ = new Subject<void>();

	public news$: Observable<NewsItem[]> = this._newsSubject.asObservable();
	public stats$: Observable<MonitoringStats> = this._statsSubject.asObservable();
	public monitoring$: Observable<boolean> = this._monitoringSubject.asObservable();
	public loading$: Observable<boolean> = this._loadingSubject.asObservable();
	public progress$: Observable<number> = this._progressSubject.asObservable();

	constructor(
		private readonly _rssParser: RssFeedParserService,
		private readonly _configService: AgentConfigService,
	) {
		this._loadNews();
		this._initAutoRefresh();
	}

	private _loadNews(): void {
		const stored = localStorage.getItem(this._storageKey);
		if (!stored) {
			return;
		}
		try {
			const news = JSON.parse(stored).map((item: NewsItem) => ({
				...item,
				pubDate: new Date(item.pubDate),
			}));
			this._newsSubject.next(news);
		} catch {
			return;
		}
	}

	private _saveNews(news: NewsItem[]): void {
		try {
			localStorage.setItem(this._storageKey, JSON.stringify(news));
		} catch {
			return;
		}
	}

	private _initAutoRefresh(): void {
		this._configService.config$.subscribe((config) => {
			if (this._manualStop) {
				return;
			}
			if (config.autoRefresh && !this._monitoringSubject.value) {
				this.startMonitoring();
			} else if (!config.autoRefresh && this._monitoringSubject.value) {
				this.stopMonitoring();
			}
		});
	}

	private _processNews(newNews: NewsItem[], newNewsCount?: number): void {
		const existingNews = this._newsSubject.value;
		const existingIds = new Set(existingNews.map((n) => n.id));

		const uniqueNewNews = newNews.filter((n) => !existingIds.has(n.id));
		const allNews = [...uniqueNewNews, ...existingNews];

		const filteredNews = this._applyFilters(allNews);

		const config = this._configService.getConfig();
		const limitedNews = filteredNews.slice(0, config.maxNewsItems);

		this._newsSubject.next(limitedNews);
		this._saveNews(limitedNews);

		if (newNewsCount !== undefined) {
			const currentStats = this._statsSubject.value;
			this._statsSubject.next({
				...currentStats,
				totalNews: allNews.length,
				filteredNews: limitedNews.length,
			});
		}
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

	private _updateStats(sourcesChecked: number): void {
		const currentStats = this._statsSubject.value;
		this._statsSubject.next({
			...currentStats,
			sourcesChecked,
			lastUpdate: new Date(),
		});
	}

	private _updateErrorCount(): void {
		const failedSourcesCount = Array.from(this._sourceErrors.values()).filter(
			(count) => count >= this._maxSourceErrors,
		).length;

		const stats = this._statsSubject.value;
		this._statsSubject.next({ ...stats, errors: failedSourcesCount });
	}

	public startMonitoring(): void {
		if (this._monitoringSubject.value) {
			return;
		}

		this._manualStop = false;
		this._sourceErrors.clear();
		this._statsSubject.next({
			...this._statsSubject.value,
			errors: 0,
		});
		this._monitoringSubject.next(true);
		this.fetchAllNews();

		const config = this._configService.getConfig();
		if (config.autoRefresh && config.checkInterval > 0) {
			this._monitoringInterval = setInterval(() => {
				this.fetchAllNews();
			}, config.checkInterval);
		}
	}

	public stopMonitoring(): void {
		this._manualStop = true;
		if (this._monitoringInterval) {
			clearInterval(this._monitoringInterval);
			this._monitoringInterval = undefined;
		}
		this._monitoringSubject.next(false);
	}

	public cancelFetch(): void {
		this._cancelRequests$.next();
		this._loadingSubject.next(false);
		this._progressSubject.next(0);
	}

	public fetchAllNews(): void {
		const config = this._configService.getConfig();
		const enabledSources = config.sources.filter((s) => s.enabled);

		if (enabledSources.length === 0) {
			return;
		}

		if (this._loadingSubject.value) {
			return;
		}

		this._loadingSubject.next(true);
		this._progressSubject.next(0);

		const availableRssSources = enabledSources.filter((source) => {
			const errorCount = this._sourceErrors.get(source.id) || 0;
			if (errorCount >= this._maxSourceErrors) {
				return false;
			}
			return true;
		});

		const totalSources = availableRssSources.length;

		if (totalSources === 0) {
			this._loadingSubject.next(false);
			this._progressSubject.next(0);
			return;
		}

		let processedSources = 0;
		let successfulSources = 0;
		let accumulatedNews: NewsItem[] = [];
		const requestDelay = config.requestDelay;

		from(availableRssSources)
			.pipe(
				concatMap((source, index) =>
					of(source).pipe(
						delay(index === 0 ? 0 : requestDelay),
						concatMap(() =>
							this._rssParser.parseRssFeed(source.url, source.name).pipe(
								tap((newsItems) => {
									this._updateSourceLastChecked(source.id);
									this._sourceErrors.set(source.id, 0);
									processedSources++;
									successfulSources++;
									const progress = (processedSources / totalSources) * 100;
									this._progressSubject.next(progress);

									accumulatedNews = [...accumulatedNews, ...newsItems];
									this._processNews(accumulatedNews, accumulatedNews.length);
									this._updateStats(successfulSources);
								}),
								catchError((error: unknown) => {
									console.error(`Error fetching ${source.name}:`, error);
									const currentErrors = this._sourceErrors.get(source.id) || 0;
									const newErrorCount = currentErrors + 1;
									this._sourceErrors.set(source.id, newErrorCount);
									this._updateErrorCount();
									processedSources++;
									const progress = (processedSources / totalSources) * 100;
									this._progressSubject.next(progress);
									return of([]);
								}),
							),
						),
					),
				),
				toArray(),
				takeUntil(this._cancelRequests$),
			)
			.subscribe({
				next: () => {
					this._loadingSubject.next(false);
					this._progressSubject.next(100);

					setTimeout(() => {
						if (!this._loadingSubject.value) {
							this._progressSubject.next(0);
						}
					}, 1000);
				},
				error: (error: unknown) => {
					console.error('Error fetching news:', error);
					this._updateErrorCount();

					this._loadingSubject.next(false);
					this._progressSubject.next(0);
				},
				complete: () => {
					if (this._loadingSubject.value) {
						this._loadingSubject.next(false);
						this._progressSubject.next(0);
					}
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
		this._statsSubject.next({
			totalNews: 0,
			filteredNews: 0,
			sourcesChecked: 0,
			lastUpdate: new Date(),
			errors: 0,
		});
	}
}
