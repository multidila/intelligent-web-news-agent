import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';

import { AgentConfig, NewsSource } from '../../models';
import { AgentConfigService } from '../../services';

@Component({
	selector: 'app-config-panel',
	standalone: true,
	imports: [CommonModule, FormsModule],
	templateUrl: './config-panel.component.html',
	styleUrls: ['./config-panel.component.scss'],
})
export class ConfigPanelComponent implements OnInit, OnDestroy {
	private readonly _destroy$ = new Subject<void>();

	public config: AgentConfig | null = null;
	public newSource: Partial<NewsSource> = {
		name: '',
		url: '',
		type: 'rss',
		enabled: true,
	};
	public newKeyword = '';
	public newExcludeKeyword = '';

	constructor(private readonly _configService: AgentConfigService) {}

	public ngOnInit(): void {
		this._configService.config$.pipe(takeUntil(this._destroy$)).subscribe((config) => {
			this.config = config;
		});
	}

	public ngOnDestroy(): void {
		this._destroy$.next();
		this._destroy$.complete();
	}

	public addSource(): void {
		if (!this.newSource.name || !this.newSource.url) {
			alert('Please fill in source name and URL');
			return;
		}

		const source: NewsSource = {
			id: Date.now().toString(),
			name: this.newSource.name,
			url: this.newSource.url,
			type: 'rss',
			enabled: true,
		};

		this._configService.addSource(source);
		this.newSource = { name: '', url: '', type: 'rss', enabled: true };
	}

	public removeSource(sourceId: string): void {
		if (confirm('Remove this source?')) {
			this._configService.removeSource(sourceId);
		}
	}

	public toggleSource(sourceId: string): void {
		this._configService.toggleSource(sourceId);
	}

	public addKeyword(): void {
		if (!this.newKeyword.trim()) {
			return;
		}

		const keywords = this.config?.filters.keywords || [];
		if (!keywords.includes(this.newKeyword.trim())) {
			this._configService.updateFilters({
				keywords: [...keywords, this.newKeyword.trim()],
			});
		}
		this.newKeyword = '';
	}

	public removeKeyword(keyword: string): void {
		const keywords = this.config?.filters.keywords || [];
		this._configService.updateFilters({
			keywords: keywords.filter((k) => k !== keyword),
		});
	}

	public addExcludeKeyword(): void {
		if (!this.newExcludeKeyword.trim()) {
			return;
		}

		const excludeKeywords = this.config?.filters.excludeKeywords || [];
		if (!excludeKeywords.includes(this.newExcludeKeyword.trim())) {
			this._configService.updateFilters({
				excludeKeywords: [...excludeKeywords, this.newExcludeKeyword.trim()],
			});
		}
		this.newExcludeKeyword = '';
	}

	public removeExcludeKeyword(keyword: string): void {
		const excludeKeywords = this.config?.filters.excludeKeywords || [];
		this._configService.updateFilters({
			excludeKeywords: excludeKeywords.filter((k) => k !== keyword),
		});
	}

	public updateCheckInterval(value: number): void {
		this._configService.updateConfig({ checkInterval: value });
	}

	public updateMaxNewsItems(value: number): void {
		this._configService.updateConfig({ maxNewsItems: value });
	}

	public updateRetryDelay(value: number): void {
		this._configService.updateConfig({ retryDelay: value });
	}

	public updateRequestDelay(value: number): void {
		this._configService.updateConfig({ requestDelay: value });
	}

	public updateMaxRetries(value: number): void {
		this._configService.updateConfig({ maxRetries: value });
	}

	public toggleAutoRefresh(): void {
		this._configService.updateConfig({ autoRefresh: !this.config?.autoRefresh });
	}

	public resetConfig(): void {
		if (confirm('Reset all configuration to defaults?')) {
			this._configService.resetConfig();
		}
	}

	public exportConfig(): void {
		const dataStr = JSON.stringify(this.config, null, 2);
		const dataBlob = new Blob([dataStr], { type: 'application/json' });
		const url = URL.createObjectURL(dataBlob);
		const link = document.createElement('a');
		link.href = url;
		link.download = 'web-agent-config.json';
		link.click();
		URL.revokeObjectURL(url);
	}
}
