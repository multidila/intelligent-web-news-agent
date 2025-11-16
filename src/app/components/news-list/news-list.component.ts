import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

import { NewsItem } from '../../models';
import { NewsAgentService } from '../../services';

@Component({
	selector: 'app-news-list',
	standalone: true,
	imports: [CommonModule],
	templateUrl: './news-list.component.html',
	styleUrls: ['./news-list.component.scss'],
})
export class NewsListComponent implements OnInit, OnDestroy {
	private readonly _destroy$ = new Subject<void>();

	public news: NewsItem[] = [];
	public filteredNews: NewsItem[] = [];
	public showOnlyUnread = false;
	public sortBy: 'relevance' | 'date' = 'relevance';

	constructor(
		private readonly _newsAgent: NewsAgentService,
		private readonly _router: Router,
	) {}

	public ngOnInit(): void {
		this._newsAgent.news$.pipe(takeUntil(this._destroy$)).subscribe((news) => {
			this.news = news;
			this.applyFilters();
		});
	}

	public ngOnDestroy(): void {
		this._destroy$.next();
		this._destroy$.complete();
	}

	public applyFilters(): void {
		let filtered = [...this.news];

		if (this.showOnlyUnread) {
			filtered = filtered.filter((n) => !n.isRead);
		}

		if (this.sortBy === 'relevance') {
			filtered.sort((a, b) => b.relevanceScore - a.relevanceScore);
		} else {
			filtered.sort((a, b) => b.pubDate.getTime() - a.pubDate.getTime());
		}

		this.filteredNews = filtered;
	}

	public toggleUnread(): void {
		this.showOnlyUnread = !this.showOnlyUnread;
		this.applyFilters();
	}

	public changeSorting(sortBy: 'relevance' | 'date'): void {
		this.sortBy = sortBy;
		this.applyFilters();
	}

	public openNews(news: NewsItem): void {
		this._newsAgent.markAsRead(news.id);
		window.open(news.link, '_blank');
	}

	public getRelevanceClass(score: number): string {
		if (score >= 5) {
			return 'high';
		}
		if (score >= 3) {
			return 'medium';
		}
		return 'low';
	}

	public getTimeAgo(date: Date): string {
		const now = new Date();
		const diff = now.getTime() - new Date(date).getTime();
		const hours = Math.floor(diff / (1000 * 60 * 60));
		const days = Math.floor(hours / 24);

		if (days > 0) {
			return `${days}d ago`;
		}
		if (hours > 0) {
			return `${hours}h ago`;
		}
		return 'just now';
	}
}
