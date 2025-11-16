import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { API_ENDPOINTS } from '../constants';
import { NewsItem } from '../models';
import { AgentConfigService } from './agent-config.service';

@Injectable({
	providedIn: 'root',
})
export class RssFeedParserService {
	private readonly _corsProxy = API_ENDPOINTS.corsProxy;

	constructor(
		private readonly _http: HttpClient,
		private readonly _configService: AgentConfigService,
	) {}

	private _parseXML(xmlText: string, sourceName: string, sourceUrl: string): NewsItem[] {
		const parser = new DOMParser();
		const xmlDoc = parser.parseFromString(xmlText, 'text/xml');

		const parserError = xmlDoc.querySelector('parsererror');
		if (parserError) {
			console.error('XML parsing error:', parserError.textContent);
			return [];
		}

		const items = xmlDoc.querySelectorAll('item');
		const newsItems: NewsItem[] = [];

		items.forEach((item, index) => {
			const title = this._getElementText(item, 'title');
			const description = this._getElementText(item, 'description');
			const link = this._getElementText(item, 'link');
			const pubDateStr = this._getElementText(item, 'pubDate');
			const category = this._getElementText(item, 'category');

			if (title && link) {
				const newsItem: NewsItem = {
					id: this._generateId(link, pubDateStr),
					title: this._cleanText(title),
					description: this._cleanText(description),
					link,
					pubDate: pubDateStr ? new Date(pubDateStr) : new Date(),
					source: sourceName,
					category,
					keywords: this._extractKeywords(title + ' ' + description),
					isRead: false,
					relevanceScore: 0,
				};

				newsItems.push(newsItem);
			}
		});

		return newsItems;
	}

	private _getElementText(parent: Element, tagName: string): string {
		const element = parent.querySelector(tagName);
		return element?.textContent?.trim() || '';
	}

	private _cleanText(text: string): string {
		const div = document.createElement('div');
		div.innerHTML = text;
		return div.textContent?.trim() || text.trim();
	}

	private _generateId(link: string, pubDate: string): string {
		const str = link + pubDate;
		let hash = 0;
		for (let i = 0; i < str.length; i++) {
			const char = str.charCodeAt(i);
			hash = Math.imul(hash, 31) + char;
		}
		return Math.abs(hash).toString(36);
	}

	private _extractKeywords(text: string): string[] {
		const config = this._configService.getConfig();
		const stopWordsSet = new Set(config.stopWords);

		const words = text
			.toLowerCase()
			.replace(/[^\w\s]/g, ' ')
			.split(/\s+/)
			.filter((word) => word.length > 3 && !stopWordsSet.has(word));

		const wordCount = new Map<string, number>();
		words.forEach((word) => {
			wordCount.set(word, (wordCount.get(word) || 0) + 1);
		});

		return Array.from(wordCount.entries())
			.sort((a, b) => b[1] - a[1])
			.slice(0, 10)
			.map(([word]) => word);
	}

	public parseRssFeed(url: string, sourceName: string): Observable<NewsItem[]> {
		const proxyUrl = `${this._corsProxy}${encodeURIComponent(url)}`;

		return this._http.get(proxyUrl, { responseType: 'text' }).pipe(
			map((xmlText) => this._parseXML(xmlText, sourceName, url)),
			catchError((error: unknown) => {
				console.error(`Error fetching RSS feed from ${url}:`, error);
				return of([]);
			}),
		);
	}
}
