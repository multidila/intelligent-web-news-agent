import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';

import { MonitoringStats } from '../../models';
import { AgentConfigService, NewsAgentService } from '../../services';

@Component({
	selector: 'app-dashboard',
	standalone: true,
	imports: [CommonModule],
	templateUrl: './dashboard.component.html',
	styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit, OnDestroy {
	private readonly _destroy$ = new Subject<void>();

	public stats: MonitoringStats | null = null;
	public isMonitoring = false;
	public enabledSourcesCount = 0;

	constructor(
		public newsAgent: NewsAgentService,
		private readonly _configService: AgentConfigService,
	) {}

	public ngOnInit(): void {
		this.newsAgent.stats$.pipe(takeUntil(this._destroy$)).subscribe((stats) => {
			this.stats = stats;
		});

		this.newsAgent.isMonitoring$.pipe(takeUntil(this._destroy$)).subscribe((isMonitoring) => {
			this.isMonitoring = isMonitoring;
		});

		this._configService.config$.pipe(takeUntil(this._destroy$)).subscribe((config) => {
			this.enabledSourcesCount = config.sources.filter((s) => s.enabled).length;
		});
	}

	public ngOnDestroy(): void {
		this._destroy$.next();
		this._destroy$.complete();
	}

	public startMonitoring(): void {
		this.newsAgent.startMonitoring();
	}

	public stopMonitoring(): void {
		this.newsAgent.stopMonitoring();
	}

	public refreshNews(): void {
		this.newsAgent.fetchAllNews();
	}

	public clearNews(): void {
		if (confirm('Are you sure you want to clear all news?')) {
			this.newsAgent.clearAllNews();
		}
	}
}
